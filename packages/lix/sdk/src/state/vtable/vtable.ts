import type { Kysely, Generated } from "kysely";
import { sql } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { Lix } from "../../lix/open-lix.js";
import { executeSync } from "../../database/execute-sync.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";
import { isStaleStateCache } from "../cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../cache/mark-state-cache-as-stale.js";
import { populateStateCache } from "../cache/populate-state-cache.js";
import { parseStatePk, serializeStatePk } from "./primary-key.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import { insertVTableLog } from "./insert-vtable-log.js";
import { commit } from "./commit.js";

// Type definition for the internal state virtual table
export type InternalStateVTable = {
	_pk: Generated<string>; // HIDDEN PRIMARY KEY
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // JSON string or null for tombstones
	schema_version: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
	inherited_from_version_id: string | null;
	change_id: Generated<string>;
	untracked: number; // SQLite uses INTEGER for boolean
	commit_id: Generated<string>;
};

// Virtual table schema definition
const VTAB_CREATE_SQL = `CREATE TABLE x(
	_pk HIDDEN TEXT NOT NULL PRIMARY KEY,
	entity_id TEXT,
	schema_key TEXT,
	file_id TEXT,
	version_id TEXT,
	plugin_key TEXT,
	snapshot_content TEXT,
	schema_version TEXT,
	created_at TEXT,
	updated_at TEXT,
	inherited_from_version_id TEXT,
	change_id TEXT,
	untracked INTEGER,
	commit_id TEXT
) WITHOUT ROWID;`;

export function applyStateVTable(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	const { sqlite, hooks } = lix;
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	sqlite.createFunction({
		name: "validate_snapshot_content",
		deterministic: true,
		arity: 5,
		// @ts-expect-error - type mismatch
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			return validateStateMutation({
				lix: { sqlite, db: db as any },
				schema: args[0] ? JSON.parse(args[0]) : null,
				snapshot_content: JSON.parse(args[1]),
				operation: args[2] || undefined,
				entity_id: args[3] || undefined,
				version_id: args[4],
			});
		},
	});

	// Create virtual table using the proper SQLite WASM API (following vtab-experiment pattern)
	const capi = sqlite.sqlite3.capi;
	const module = new capi.sqlite3_module();

	// Store cursor state
	const cursorStates = new Map();

	/**
	 * Flag to prevent recursion when updating cache state.
	 *
	 * The guard ensures that while we're marking cache as fresh, any nested state queries
	 * bypass the cache and use materialized state directly, preventing recursion.
	 *
	 * Why is this needed is unclear. Queries are executed in sync. Why concurrent
	 * reads simultaneously update the cache is not clear. Given that state
	 * materialization is rare, this workaround has been deemed sufficient.
	 *
	 * This is a temporary fix and should be revisited in the future.
	 */
	let isUpdatingCacheState = false;

	module.installMethods(
		{
			xCreate: (
				dbHandle: any,
				_pAux: any,
				_argc: number,
				_argv: any,
				pVTab: any
			) => {
				const result = capi.sqlite3_declare_vtab(dbHandle, VTAB_CREATE_SQL);
				if (result !== capi.SQLITE_OK) {
					return result;
				}

				sqlite.sqlite3.vtab.xVtab.create(pVTab);
				return capi.SQLITE_OK;
			},

			xConnect: (
				dbHandle: any,
				_pAux: any,
				_argc: number,
				_argv: any,
				pVTab: any
			) => {
				const result = capi.sqlite3_declare_vtab(dbHandle, VTAB_CREATE_SQL);
				if (result !== capi.SQLITE_OK) {
					return result;
				}

				sqlite.sqlite3.vtab.xVtab.create(pVTab);
				return capi.SQLITE_OK;
			},

			xBegin: () => {
				// TODO comment in after all internal v-table logic uses underlying state view
				// // assert that we are not already in a transaction (the internal_change_in_transaction table is empty)
				// const existingChangesInTransaction = executeSync({
				// 	lix: { sqlite },
				// 	query: db.selectFrom("internal_change_in_transaction").selectAll(),
				// });
				// if (existingChangesInTransaction.length > 0) {
				// 	const errorMessage = "Transaction already in progress";
				// 	if (canLog()) {
				// 		createLixOwnLogSync({
				// 			lix: { sqlite, db: db as any },
				// 			key: "lix_state_xbegin_error",
				// 			level: "error",
				// 			message: `xBegin error: ${errorMessage}`,
				// 		});
				// 	}
				// 	throw new Error(errorMessage);
				// }
			},

			xCommit: () => {
				return commit({ lix: { sqlite, db: db as any, hooks } });
			},

			xRollback: () => {
				sqlite.exec({
					sql: "DELETE FROM internal_transaction_state",
					returnValue: "resultRows",
				});
			},

			xBestIndex: (pVTab: any, pIdxInfo: any) => {
				try {
					const idxInfo = sqlite.sqlite3.vtab.xIndexInfo(pIdxInfo);

					// Track which columns have equality constraints
					const usableConstraints: string[] = [];
					let argIndex = 0;

					// Column mapping (matching the CREATE TABLE order in xCreate/xConnect)
					const columnMap = [
						"_pk", // 0 (HIDDEN column)
						"entity_id", // 1
						"schema_key", // 2
						"file_id", // 3
						"version_id", // 4
						"plugin_key", // 5
						"snapshot_content", // 6
						"schema_version", // 7
						"created_at", // 8
						"updated_at", // 9
						"inherited_from_version_id", // 10
						"change_id", // 11
						"untracked", // 12
						"commit_id", // 13
					];

					// Process constraints
					// @ts-expect-error - idxInfo.$nConstraint is not defined in the type
					for (let i = 0; i < idxInfo.$nConstraint; i++) {
						// @ts-expect-error - idxInfo.nthConstraint is not defined in the type
						const constraint = idxInfo.nthConstraint(i);

						// Only handle equality constraints that are usable
						if (
							constraint.$op === capi.SQLITE_INDEX_CONSTRAINT_EQ &&
							constraint.$usable
						) {
							const columnName = columnMap[constraint.$iColumn];
							if (columnName) {
								usableConstraints.push(columnName);

								// Mark this constraint as used
								// @ts-expect-error - idxInfo.nthConstraintUsage is not defined in the type
								idxInfo.nthConstraintUsage(i).$argvIndex = ++argIndex;
							}
						}
					}

					const fullTableCost = 1000000; // Default cost for full table scan
					const fullTableRows = 10000000;

					// Set the index string to pass column names to xFilter
					if (usableConstraints.length > 0) {
						const idxStr = usableConstraints.join(",");
						// @ts-expect-error - idxInfo.$idxStr is not defined in the type
						idxInfo.$idxStr = sqlite.sqlite3.wasm.allocCString(idxStr, false);
						// @ts-expect-error - idxInfo.$needToFreeIdxStr is not defined in the type
						idxInfo.$needToFreeIdxStr = 1; // We don't need SQLite to free this string

						// Lower cost when we can use filters (more selective)
						// @ts-expect-error - idxInfo.$estimatedCost is not defined in the type
						idxInfo.$estimatedCost =
							fullTableCost / (usableConstraints.length + 1);
						// @ts-expect-error - idxInfo.$estimatedRows is not defined in the type
						idxInfo.$estimatedRows = Math.ceil(
							fullTableRows / (usableConstraints.length + 1)
						);
					} else {
						// @ts-expect-error - idxInfo.$needToFreeIdxStr is not defined in the type
						idxInfo.$needToFreeIdxStr = 0;

						// Higher cost for full table scan
						// @ts-expect-error - idxInfo.$estimatedCost is not defined in the type
						idxInfo.$estimatedCost = fullTableCost;
						// @ts-expect-error - idxInfo.$estimatedRows is not defined in the type
						idxInfo.$estimatedRows = fullTableRows;
					}

					return capi.SQLITE_OK;
				} finally {
					// Always log timing even if error occurs
				}
			},

			xDisconnect: () => {
				return capi.SQLITE_OK;
			},

			xDestroy: () => {
				return capi.SQLITE_OK;
			},

			xOpen: (_pVTab: any, pCursor: any) => {
				const cursor = sqlite.sqlite3.vtab.xCursor.create(pCursor);
				cursorStates.set(cursor.pointer, {
					results: [],
					rowIndex: 0,
				});
				return capi.SQLITE_OK;
			},

			xClose: (pCursor: any) => {
				cursorStates.delete(pCursor);
				return capi.SQLITE_OK;
			},

			xFilter: (
				pCursor: any,
				idxNum: number,
				idxStrPtr: number,
				argc: number,
				argv: any
			) => {
				const cursorState = cursorStates.get(pCursor);
				const idxStr = sqlite.sqlite3.wasm.cstrToJs(idxStrPtr);

				// Debug: Track recursion depth
				const recursionKey = "_vtab_recursion_depth";
				// @ts-expect-error - using global for debugging
				const currentDepth = (globalThis[recursionKey] || 0) + 1;
				// @ts-expect-error - using global for debugging
				globalThis[recursionKey] = currentDepth;

				if (currentDepth > 10) {
					// @ts-expect-error - using global for debugging
					globalThis[recursionKey] = 0; // Reset
					throw new Error(
						`Virtual table recursion depth exceeded: ${currentDepth}`
					);
				}

				try {
					// Extract filter arguments if provided
					const filters: Record<string, any> = {};
					if (argc > 0 && argv) {
						const args = sqlite.sqlite3.capi.sqlite3_values_to_js(argc, argv);
						// Parse idxStr to understand which columns are being filtered
						// idxStr format: "column1,column2,..."
						if (idxStr) {
							const columns = idxStr.split(",").filter((c) => c.length > 0);
							for (let i = 0; i < Math.min(columns.length, args.length); i++) {
								if (args[i] !== null) {
									filters[columns[i]!] = args[i]; // Keep original type
								}
							}
						}
					}

					// If we're updating cache state, we must use resolved state view directly to avoid recursion
					if (isUpdatingCacheState) {
						// Query directly from resolved state (now includes tombstones)
						let query = db
							.selectFrom("internal_resolved_state_all")
							.selectAll();

						// Apply filters
						for (const [column, value] of Object.entries(filters)) {
							query = query.where(column as any, "=", value);
						}

						const stateResults = executeSync({
							lix: { sqlite },
							query,
						});

						cursorState.results = stateResults || [];
						cursorState.rowIndex = 0;
						return capi.SQLITE_OK;
					}

					// Normal path: check cache staleness
					const cacheIsStale = isStaleStateCache({
						runtime: { sqlite, db: db as any },
					});

					// Try cache first - but only if it's not stale
					let cacheResults: any[] | null = null;
					if (!cacheIsStale) {
						// Select directly from resolved state using Kysely (includes tombstones)
						let query = db
							.selectFrom("internal_resolved_state_all")
							.selectAll();

						// Apply filters
						for (const [column, value] of Object.entries(filters)) {
							query = query.where(column as any, "=", value);
						}

						cacheResults = executeSync({
							lix: { sqlite },
							query,
						});
					}

					cursorState.results = cacheResults || [];
					cursorState.rowIndex = 0;

					if (cacheIsStale) {
						// Populate cache directly with materialized state
						populateStateCache({ runtime: { sqlite, db: db as any } });

						// Do not log here: xFilter can be invoked during SELECT-only paths
						// and should avoid writing to the transaction state/logs.

						// Mark cache as fresh after population
						isUpdatingCacheState = true;
						try {
							markStateCacheAsFresh({
								runtime: { sqlite, db: db as any, hooks },
							});
						} finally {
							isUpdatingCacheState = false;
						}

						let query = db
							.selectFrom("internal_resolved_state_all")
							.selectAll();

						// Apply filters
						for (const [column, value] of Object.entries(filters)) {
							query = query.where(column as any, "=", value);
						}

						const newResults = executeSync({
							lix: { sqlite },
							query,
						});
						cursorState.results = newResults || [];
					}

					return capi.SQLITE_OK;
				} finally {
					// Always decrement recursion depth
					// @ts-expect-error - using global for debugging
					globalThis[recursionKey] = currentDepth - 1;
				}
			},

			xNext: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				cursorState.rowIndex++;
				return capi.SQLITE_OK;
			},

			xEof: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				return cursorState.rowIndex >= cursorState.results.length ? 1 : 0;
			},

			xColumn: (pCursor: any, pContext: any, iCol: number) => {
				const cursorState = cursorStates.get(pCursor);
				const row = cursorState.results[cursorState.rowIndex];

				if (!row) {
					capi.sqlite3_result_null(pContext);
					return capi.SQLITE_OK;
				}

				// Handle primary key column (_pk)
				if (iCol === 0) {
					if (Array.isArray(row)) {
						// For array results, _pk is at index 0
						capi.sqlite3_result_js(pContext, row[0]);
					} else if (row._pk) {
						// If row already has _pk, use it
						capi.sqlite3_result_js(pContext, row._pk);
					} else {
						// Generate primary key from row data
						const tag = row.untracked ? "U" : "C";
						const primaryKey = serializeStatePk(
							tag,
							row.file_id,
							row.entity_id,
							row.version_id
						);
						capi.sqlite3_result_js(pContext, primaryKey);
					}
					return capi.SQLITE_OK;
				}

				// Handle array-style results from SQLite exec
				let value;
				if (Array.isArray(row)) {
					// For array results, composite_key is at index 0, so we use iCol directly
					value = row[iCol];
				} else {
					const columnName = getColumnName(iCol);
					value = row[columnName];
				}

				// Handle special cases for null values that might be stored as strings
				if (
					value === "null" &&
					getColumnName(iCol) === "inherited_from_version_id"
				) {
					capi.sqlite3_result_null(pContext);
					return capi.SQLITE_OK;
				}

				if (value === null) {
					capi.sqlite3_result_null(pContext);
				} else {
					capi.sqlite3_result_js(pContext, value);
				}

				return capi.SQLITE_OK;
			},

			xRowid: () => {
				// For WITHOUT ROWID tables, xRowid should not be called
				// But if it is, we return an error
				return capi.SQLITE_ERROR;
			},

			xUpdate: (_pVTab: number, nArg: number, ppArgv: any) => {
				try {
					const _timestamp = getTimestampSync({
						runtime: { sqlite, db: db as any, hooks },
					});
					// Extract arguments using the proper SQLite WASM API
					const args = sqlite.sqlite3.capi.sqlite3_values_to_js(nArg, ppArgv);

					// DELETE operation: nArg = 1, args[0] = old primary key
					if (nArg === 1) {
						const oldPk = args[0] as string;
						if (!oldPk) {
							throw new Error("Missing primary key for DELETE operation");
						}

						// Use handleStateDelete for all cases - it handles both tracked and untracked
						handleStateDelete(lix as any, oldPk, _timestamp);

						return capi.SQLITE_OK;
					}

					// INSERT operation: nArg = N+2, args[0] = NULL, args[1] = new primary key
					// UPDATE operation: nArg = N+2, args[0] = old primary key, args[1] = new primary key
					const isInsert = args[0] === null;
					const isUpdate = args[0] !== null;

					if (!isInsert && !isUpdate) {
						throw new Error("Invalid xUpdate operation");
					}

					// Extract column values (args[2] through args[N+1])
					// Column order: _pk, entity_id, schema_key, file_id, version_id, plugin_key,
					//               snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, change_id, untracked
					const entity_id = args[3];
					const schema_key = args[4];
					const file_id = args[5];
					const version_id = args[6];
					const plugin_key = args[7];
					// this is an update where we have a snapshot_content
					// the snapshot_content is a JSON string as returned by SQlite
					const snapshot_content = args[8] as string;
					const schema_version = args[9];
					// Skip created_at (args[10]), updated_at (args[11]), inherited_from_version_id (args[12]), change_id (args[13])
					const untracked = args[14] ?? false;

					// assert required fields
					if (!entity_id || !schema_key || !file_id || !plugin_key) {
						throw new Error("Missing required fields for state mutation");
					}

					if (!version_id) {
						throw new Error("version_id is required for state mutation");
					}

					// Call validation function (same logic as triggers)
					const storedSchema = getStoredSchema(lix as any, schema_key);

					validateStateMutation({
						lix: lix as any,
						schema: storedSchema ? JSON.parse(storedSchema) : null,
						snapshot_content: JSON.parse(snapshot_content),
						operation: isInsert ? "insert" : "update",
						entity_id: String(entity_id),
						version_id: String(version_id),
						untracked: Boolean(untracked),
					});

					// Use insertTransactionState which handles both tracked and untracked entities
					insertTransactionState({
						lix: lix as any,
						timestamp: _timestamp,
						data: [
							{
								entity_id: String(entity_id),
								schema_key: String(schema_key),
								file_id: String(file_id),
								plugin_key: String(plugin_key),
								snapshot_content,
								schema_version: String(schema_version),
								version_id: String(version_id),
								untracked: Boolean(untracked),
							},
						],
					});

					// TODO: This cache copying logic is a temporary workaround for shared commits.
					// The proper solution requires improving cache miss logic to handle commit sharing
					// without duplicating entries. See: https://github.com/opral/lix-sdk/issues/309
					//
					// Handle cache copying for new versions that share commits (v2 cache)
					// Updated for commit-anchored tips: trigger on lix_version_tip writes
					if (isInsert && String(schema_key) === "lix_version_tip") {
						// Skip tombstone inserts where snapshot_content is null
						let tipData: any = null;
						try {
							tipData = snapshot_content ? JSON.parse(snapshot_content) : null;
						} catch {
							// ignore parse errors; treat as tombstone/malformed and skip
							tipData = null;
						}

						const newVersionId = tipData?.id;
						const commitId = tipData?.commit_id;

						if (newVersionId && commitId) {
							// Find other versions that point to the same commit
							const existingVersionsWithSameCommit = sqlite.exec({
								sql: `
									SELECT json_extract(snapshot_content, '$.id') as version_id
									FROM internal_resolved_state_all 
									WHERE schema_key = 'lix_version_tip' 
									  AND version_id = 'global'
									  AND commit_id = ?
									  AND json_extract(snapshot_content, '$.id') != ?
								`,
								bind: [commitId, newVersionId],
								returnValue: "resultRows",
							});

							// If there are existing versions with the same commit, copy their cache entries
							if (
								existingVersionsWithSameCommit &&
								existingVersionsWithSameCommit.length > 0
							) {
								const sourceVersionId = existingVersionsWithSameCommit[0]![0]; // Take first existing version

								// Get all unique schema keys from the source version
								const schemaKeys = sqlite.exec({
									sql: `SELECT DISTINCT schema_key FROM internal_state_cache WHERE version_id = ? AND schema_key NOT IN ('lix_version_tip','lix_version_descriptor')`,
									bind: [sourceVersionId],
									returnValue: "resultRows",
								}) as string[][];

								// Copy cache entries for each schema key to the appropriate physical table
								for (const row of schemaKeys || []) {
									const sourceSchemaKey = row[0];
									if (!sourceSchemaKey) continue;
									const sanitizedSchemaKey = sourceSchemaKey.replace(
										/[^a-zA-Z0-9]/g,
										"_"
									);
									const tableName = `internal_state_cache_${sanitizedSchemaKey}`;

									// Check if table exists first
									const tableExists = sqlite.exec({
										sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
										bind: [tableName],
										returnValue: "resultRows",
									});

									if (tableExists && tableExists.length > 0) {
										// Copy entries from source version to new version using v2 cache structure
										sqlite.exec({
											sql: `
												INSERT OR IGNORE INTO ${tableName} 
												(entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, inheritance_delete_marker, change_id, commit_id)
												SELECT 
													entity_id, schema_key, file_id, ?, plugin_key, snapshot_content, schema_version, created_at, updated_at, 
													CASE 
														WHEN inherited_from_version_id IS NULL THEN ?
														ELSE inherited_from_version_id
													END as inherited_from_version_id,
													inheritance_delete_marker, change_id, commit_id
												FROM ${tableName}
												WHERE version_id = ?
											`,
											bind: [newVersionId, sourceVersionId, sourceVersionId],
										});
									}
								}
							}
						}
					}
					return capi.SQLITE_OK;
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);

					// Log error for debugging
					insertVTableLog({
						lix,
						timestamp: getTimestampSync({
							runtime: { sqlite, db: db as any, hooks },
						}),
						key: "lix_state_xupdate_error",
						level: "error",
						message: `xUpdate error: ${errorMessage}`,
					});

					throw error; // Re-throw to propagate error
				}
			},
		},
		false
	);

	// Register the vtable under a clearer internal name
	capi.sqlite3_create_module(
		sqlite.pointer!,
		"internal_state_vtable",
		module,
		0
	);

	// Create the internal vtable (raw state surface)
	sqlite.exec(
		`CREATE VIRTUAL TABLE IF NOT EXISTS internal_state_vtable USING internal_state_vtable();`
	);
}

export function handleStateDelete(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">,
	primaryKey: string,
	timestamp: string
): void {
	// Query the row to delete using the resolved state view with Kysely
	const rowToDelete = executeSync({
		lix,
		query: (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"version_id",
				"plugin_key",
				"snapshot_content",
				"schema_version",
				"untracked",
				"inherited_from_version_id",
			])
			.where("_pk", "=", primaryKey),
	})[0];

	if (!rowToDelete) {
		throw new Error(`Row not found for primary key: ${primaryKey}`);
	}

	const entity_id = rowToDelete.entity_id;
	const schema_key = rowToDelete.schema_key;
	const file_id = rowToDelete.file_id;
	const version_id = rowToDelete.version_id;
	const plugin_key = rowToDelete.plugin_key;
	const snapshot_content = rowToDelete.snapshot_content;
	const schema_version = rowToDelete.schema_version;
	const untracked = rowToDelete.untracked;

	// If entity is untracked, handle differently based on its source (transaction/inherited/direct)
	if (untracked) {
		// Parse the primary key tag to determine where the row is coming from in the resolved view
		const parsed = parseStatePk(primaryKey);

		if (parsed.tag === "UI") {
			// Inherited untracked: create a tombstone to block inheritance
			insertTransactionState({
				lix,
				timestamp,
				data: [
					{
						entity_id: String(entity_id),
						schema_key: String(schema_key),
						file_id: String(file_id),
						plugin_key: String(plugin_key),
						snapshot_content: null, // Deletion tombstone
						schema_version: String(schema_version),
						version_id: String(version_id),
						untracked: true,
					},
				],
			});
			return;
		}

		if (parsed.tag === "T" || parsed.tag === "TI") {
			// The row is coming from the transaction stage (pending untracked insert/update).
			// Overwrite the pending transaction row with a deletion so the commit drops it
			// and nothing is persisted to the untracked table.
			insertTransactionState({
				lix,
				timestamp,
				data: [
					{
						entity_id: String(entity_id),
						schema_key: String(schema_key),
						file_id: String(file_id),
						plugin_key: String(plugin_key),
						snapshot_content: null, // mark as delete in txn
						schema_version: String(schema_version),
						version_id: String(version_id),
						untracked: true,
					},
				],
			});
			return;
		}

		// Direct untracked in this version (U tag) – delete from the untracked table immediately
		executeSync({
			lix,
			query: (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
				.deleteFrom("internal_state_all_untracked")
				.where("entity_id", "=", String(entity_id))
				.where("schema_key", "=", String(schema_key))
				.where("file_id", "=", String(file_id))
				.where("version_id", "=", String(version_id)),
		});
		return;
	}

	const storedSchema = getStoredSchema(lix, schema_key);

	validateStateMutation({
		lix,
		schema: storedSchema ? JSON.parse(storedSchema) : null,
		snapshot_content: JSON.parse(snapshot_content as string),
		operation: "delete",
		entity_id: String(entity_id),
		version_id: String(version_id),
	});

	insertTransactionState({
		lix,
		timestamp,
		data: [
			{
				entity_id: String(entity_id),
				schema_key: String(schema_key),
				file_id: String(file_id),
				plugin_key: String(plugin_key),
				snapshot_content: null, // No snapshot content for DELETE
				schema_version: String(schema_version),
				version_id: String(version_id),
				untracked: false, // tracked entity
			},
		],
	});
}

// Helper functions for the virtual table

function getStoredSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">,
	schemaKey: any
): string | null {
	// Query directly from internal_resolved_state_all to avoid vtable recursion
	const result = executeSync({
		lix,
		query: (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
			.where("schema_key", "=", "lix_stored_schema")
			.where(
				sql`json_extract(snapshot_content, '$.key')`,
				"=",
				String(schemaKey)
			)
			.where("snapshot_content", "is not", null)
			.limit(1),
	});

	return result && result.length > 0 ? result[0]!.value : null;
}

function getColumnName(columnIndex: number): string {
	const columns = [
		"_pk",
		"entity_id",
		"schema_key",
		"file_id",
		"version_id",
		"plugin_key",
		"snapshot_content",
		"schema_version",
		"created_at",
		"updated_at",
		"inherited_from_version_id",
		"change_id",
		"untracked",
		"commit_id",
	];
	return columns[columnIndex] || "unknown";
}
