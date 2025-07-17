import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import { handleStateMutation } from "./handle-state-mutation.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import { executeSync } from "../database/execute-sync.js";
import {
	applyMaterializeStateSchema,
	materializeState,
} from "./materialize-state.js";
import { applyUnderlyingStateView } from "./underlying-state-view.js";
import { applyStateCacheSchema } from "./cache/schema.js";
import { selectFromStateCache } from "./cache/select-from-state-cache.js";
import { isStaleStateCache } from "./cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "./cache/mark-state-cache-as-stale.js";
import { commit } from "./commit.js";

// Virtual table schema definition
const VTAB_CREATE_SQL = `CREATE TABLE x(
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
	change_set_id TEXT
)`;

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	hooks: LixHooks
): SqliteWasmDatabase {
	applyMaterializeStateSchema(sqlite);
	applyStateCacheSchema({ sqlite });
	applyUnderlyingStateView({ sqlite, db });

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

	// Cache initialization state to avoid repeated table existence checks
	let loggingInitialized: boolean | null = null;

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

	const canLog = () => {
		if (loggingInitialized === null) {
			try {
				const tableExists = sqlite.exec({
					sql: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='key_value'",
					returnValue: "resultRows",
				});
				loggingInitialized = tableExists && tableExists.length > 0;
			} catch {
				loggingInitialized = false;
			}
		}
		return loggingInitialized;
	};

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

				// wiping all rows on connect simulates a temp table for internal_change_in_transaction.
				// we need to clear any existing changes on connect in case a transaction remained open.
				// otherwise, the lix can't boot up properly and will throw an error.
				//
				// an open transaction can happen if the storage layer crashes or is not properly shut down.
				//
				// PS internal_change_in_transaction is not a temp table because sqlite
				// prohibits access to temp tables from virtual tables
				executeSync({
					lix: { sqlite },
					query: db.deleteFrom("internal_change_in_transaction"),
				});

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
					sql: "DELETE FROM internal_change_in_transaction",
					returnValue: "resultRows",
				});
			},

			xBestIndex: (pVTab: any, pIdxInfo: any) => {
				const idxInfo = sqlite.sqlite3.vtab.xIndexInfo(pIdxInfo);

				// Track which columns have equality constraints
				const usableConstraints: string[] = [];
				let argIndex = 0;

				// Column mapping (matching the CREATE TABLE order in xCreate/xConnect)
				const columnMap = [
					"entity_id", // 0
					"schema_key", // 1
					"file_id", // 2
					"version_id", // 3
					"plugin_key", // 4
					"snapshot_content", // 5
					"schema_version", // 6
					"created_at", // 7
					"updated_at", // 8
					"inherited_from_version_id", // 9
					"change_id", // 10
					"untracked", // 11
					"change_set_id", // 12
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

				// If we're updating cache state, we must use materialized state directly to avoid recursion
				if (isUpdatingCacheState) {
					// console.log(
					// 	"Updating cache state, using materialized state directly"
					// );
					// Directly materialize state without cache
					const stateResults = materializeState(sqlite, filters, false);
					cursorState.results = stateResults || [];
					cursorState.rowIndex = 0;
					return capi.SQLITE_OK;
				}

				// Normal path: check cache staleness
				const cacheIsStale = isStaleStateCache({ lix: { sqlite } });

				// Try cache first - but only if it's not stale
				let cacheResults: any[] | null = null;
				if (!cacheIsStale) {
					cacheResults = selectFromStateCache({ lix: { sqlite }, filters });
				}

				cursorState.results = cacheResults || [];
				cursorState.rowIndex = 0;

				if (cacheIsStale) {
					// console.log("State cache is stale, will materialize state from CTE");
					// Cache miss - populate cache with actual recursive state query
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_cache_miss",
							level: "debug",
							message: `Cache miss detected - materializing state from CTE`,
						});
					}

					// Run the expensive recursive CTE to materialize state
					// Include deletions when populating cache so inheritance blocking works
					const stateResults = materializeState(sqlite, {}, true);

					// Populate cache with materialized state results
					if (stateResults && stateResults.length > 0) {
						let cachePopulated = false;
						for (const row of stateResults) {
							// CTE returns rows as arrays, so access by index
							const entity_id = Array.isArray(row) ? row[0] : row.entity_id;
							const schema_key = Array.isArray(row) ? row[1] : row.schema_key;
							const file_id = Array.isArray(row) ? row[2] : row.file_id;
							const plugin_key = Array.isArray(row) ? row[3] : row.plugin_key;
							const snapshot_content = Array.isArray(row)
								? row[4]
								: row.snapshot_content;
							const schema_version = Array.isArray(row)
								? row[5]
								: row.schema_version;
							const version_id = Array.isArray(row) ? row[6] : row.version_id;
							const created_at = Array.isArray(row) ? row[7] : row.created_at;
							const updated_at = Array.isArray(row) ? row[8] : row.updated_at;
							const inherited_from_version_id = Array.isArray(row)
								? row[9]
								: row.inherited_from_version_id;
							const change_id = Array.isArray(row) ? row[10] : row.change_id;
							const change_set_id = Array.isArray(row)
								? row[11]
								: row.change_set_id;

							// Skip rows with null entity_id (no actual state data found)
							if (!entity_id) {
								continue;
							}

							const isDeletion = snapshot_content === null;

							// TODO the CTE should not return inherited entities (optimization for later)
							// Skip inherited entities - they should be resolved via inheritance logic, not stored as duplicates
							if (inherited_from_version_id !== null) {
								continue;
							}

							executeSync({
								lix: { sqlite },
								query: db
									.insertInto("internal_state_cache")
									.values({
										entity_id,
										schema_key,
										file_id,
										version_id,
										plugin_key,
										snapshot_content: isDeletion ? null : snapshot_content,
										schema_version,
										created_at,
										updated_at,
										inherited_from_version_id,
										inheritance_delete_marker: isDeletion ? 1 : 0,
										change_id: change_id || "unknown-change-id",
										change_set_id: change_set_id || "untracked",
									})
									.onConflict((oc) =>
										oc
											.columns([
												"entity_id",
												"schema_key",
												"file_id",
												"version_id",
											])
											.doUpdateSet({
												plugin_key,
												snapshot_content: isDeletion ? null : snapshot_content,
												schema_version,
												created_at,
												updated_at,
												inherited_from_version_id,
												inheritance_delete_marker: isDeletion ? 1 : 0,
												change_id: change_id || "unknown-change-id",
												change_set_id: change_set_id || "untracked",
											})
									),
							});
							cachePopulated = true;
						}

						if (cachePopulated) {
							// Mark cache as fresh after population
							isUpdatingCacheState = true;
							try {
								markStateCacheAsFresh({ lix: { sqlite } });
							} finally {
								isUpdatingCacheState = false;
							}

							if (canLog()) {
								createLixOwnLogSync({
									lix: { sqlite, db: db as any },
									key: "lix_state_cache_populated",
									level: "debug",
									message: `Cache populated with ${stateResults?.length || 0} rows from CTE`,
								});
							}
						}
					}

					const newResults = selectFromStateCache({
						lix: { sqlite },
						filters,
					});
					cursorState.results = newResults || [];
				} else {
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_cache_hit",
							level: "debug",
							message: `Cache hit - returning ${cursorState.results.length} cached rows`,
						});
					}
				}

				return capi.SQLITE_OK;
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

				// Handle array-style results from SQLite exec
				let value;
				if (Array.isArray(row)) {
					// Account for rowid being the first column (index 0)
					// So we need to shift all column indices by 1
					value = row[iCol + 1];
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

			xRowid: (pCursor: any, pRowid: any) => {
				const cursorState = cursorStates.get(pCursor);
				const row = cursorState.results[cursorState.rowIndex];

				if (!row) {
					return capi.SQLITE_ERROR;
				}

				// Extract rowid from the result row
				let rowid;
				if (Array.isArray(row)) {
					// rowid is the first column (index 0)
					rowid = row[0];
				} else {
					// rowid is a property on the object
					rowid = row.rowid;
				}

				// Use the actual rowid from the cache table
				sqlite.sqlite3.vtab.xRowid(pRowid, rowid);
				return capi.SQLITE_OK;
			},

			xUpdate: (_pVTab: number, nArg: number, ppArgv: any) => {
				try {
					// Extract arguments using the proper SQLite WASM API
					const args = sqlite.sqlite3.capi.sqlite3_values_to_js(nArg, ppArgv);

					// DELETE operation: nArg = 1, args[0] = old rowid
					if (nArg === 1) {
						// For DELETE, we need the old row data to pass to handleStateMutation
						// We can't get this from the virtual table directly, so we'll need to
						// handle DELETE differently:
						// we query the row by rowid and pass it to handleStateMutation

						handleStateDelete(sqlite, args[0]! as number, db);

						return capi.SQLITE_OK;
					}

					// INSERT operation: nArg = N+2, args[0] = NULL, args[1] = new rowid
					// UPDATE operation: nArg = N+2, args[0] = old rowid, args[1] = new rowid
					const isInsert = args[0] === null;
					const isUpdate = args[0] !== null;

					if (!isInsert && !isUpdate) {
						throw new Error("Invalid xUpdate operation");
					}

					// Extract column values (args[2] through args[N+1])
					// Column order: entity_id, schema_key, file_id, version_id, plugin_key,
					//               snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, change_id, untracked
					const entity_id = args[2];
					const schema_key = args[3];
					const file_id = args[4];
					const version_id = args[5];
					const plugin_key = args[6];
					// this is an update where we have a snapshot_content
					// the snapshot_content is a JSON string as returned by SQlite
					const snapshot_content = args[7] as string;
					const schema_version = args[8];
					// Skip created_at (args[9]), updated_at (args[10]), inherited_from_version_id (args[11]), change_id (args[12])
					const untracked = args[13] ?? false;

					// assert required fields
					if (!entity_id || !schema_key || !file_id || !plugin_key) {
						throw new Error("Missing required fields for state mutation");
					}

					if (!version_id) {
						throw new Error("version_id is required for state mutation");
					}

					// Call validation function (same logic as triggers)
					const storedSchema = getStoredSchema(sqlite, schema_key);

					validateStateMutation({
						lix: { sqlite, db: db as any },
						schema: storedSchema ? JSON.parse(storedSchema) : null,
						snapshot_content: JSON.parse(snapshot_content),
						operation: isInsert ? "insert" : "update",
						entity_id: String(entity_id),
						version_id: String(version_id),
						untracked: Boolean(untracked),
					});

					// Route based on untracked flag
					if (untracked) {
						// Handle untracked mutation - write directly to untracked table
						executeSync({
							lix: { sqlite },
							query: db
								.insertInto("internal_state_all_untracked")
								.values({
									entity_id: String(entity_id),
									schema_key: String(schema_key),
									file_id: String(file_id),
									version_id: String(version_id),
									plugin_key: String(plugin_key),
									snapshot_content,
									schema_version: String(schema_version),
								})
								.onConflict((oc) =>
									oc
										.columns([
											"entity_id",
											"schema_key",
											"file_id",
											"version_id",
										])
										.doUpdateSet({
											plugin_key: String(plugin_key),
											snapshot_content,
											schema_version: String(schema_version),
										})
								),
						});
					} else {
						// Handle tracked mutation - normal change control
						// If there's existing untracked state, delete it first (tracked overrides untracked)
						executeSync({
							lix: { sqlite },
							query: db
								.deleteFrom("internal_state_all_untracked")
								.where("entity_id", "=", String(entity_id))
								.where("schema_key", "=", String(schema_key))
								.where("file_id", "=", String(file_id))
								.where("version_id", "=", String(version_id)),
						});

						// Call handleStateMutation (same logic as triggers)
						handleStateMutation(
							sqlite,
							db,
							String(entity_id),
							String(schema_key),
							String(file_id),
							String(plugin_key),
							snapshot_content,
							String(version_id),
							String(schema_version)
						);
					}

					// TODO: This cache copying logic is a temporary workaround for shared change sets.
					// The proper solution requires improving cache miss logic to handle change set sharing
					// without duplicating entries. See: https://github.com/opral/lix-sdk/issues/309
					//
					// Handle cache copying for new versions that share change sets
					if (isInsert && String(schema_key) === "lix_version") {
						const versionData = JSON.parse(snapshot_content);
						const newVersionId = versionData.id;
						const changeSetId = versionData.change_set_id;

						if (newVersionId && changeSetId) {
							// Find other versions that already use this change set
							const existingVersionsWithSameChangeSet = sqlite.exec({
								sql: `
									SELECT json_extract(snapshot_content, '$.id') as version_id
									FROM internal_state_cache 
									WHERE schema_key = 'lix_version' 
									  AND json_extract(snapshot_content, '$.change_set_id') = ?
									  AND json_extract(snapshot_content, '$.id') != ?
								`,
								bind: [changeSetId, newVersionId],
								returnValue: "resultRows",
							});

							// If there are existing versions with the same change set, copy their cache entries
							if (
								existingVersionsWithSameChangeSet &&
								existingVersionsWithSameChangeSet.length > 0
							) {
								const sourceVersionId =
									existingVersionsWithSameChangeSet[0]![0]; // Take first existing version

								// Copy cache entries from source version to new version
								sqlite.exec({
									sql: `
										INSERT OR IGNORE INTO internal_state_cache 
										(entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, inheritance_delete_marker, change_id, change_set_id)
										SELECT 
											entity_id, schema_key, file_id, ?, plugin_key, snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, inheritance_delete_marker, change_id, change_set_id
										FROM internal_state_cache
										WHERE version_id = ? AND schema_key != 'lix_version'
									`,
									bind: [newVersionId, sourceVersionId],
								});
							}
						}
					}

					return capi.SQLITE_OK;
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);

					// Log error for debugging
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_xupdate_error",
							level: "error",
							message: `xUpdate error: ${errorMessage}`,
						});
					}

					throw error; //new Error("test");

					// const vtab = sqlite.sqlite3.vtab.xVtab.get(_pVTab);

					// // Set proper error message on the virtual table
					// if (vtab) {
					// 	// Free any existing error message first
					// 	if (vtab.zErrMsg) {
					// 		capi.sqlite3_free(vtab.zErrMsg);
					// 	}
					// 	// Allocate new error message using sqlite3_malloc
					// 	const errorBytes = new TextEncoder().encode(errorMessage + "\0");
					// 	const errorPtr = capi.sqlite3_malloc(errorBytes.length);
					// 	if (errorPtr) {
					// 		sqlite.sqlite3.wasm.heap8u().set(errorBytes, errorPtr);
					// 		vtab.zErrMsg = errorPtr;
					// 	}
					// }

					// return capi.SQLITE_ERROR;
				}
			},
		},
		false
	);

	capi.sqlite3_create_module(sqlite.pointer!, "state_vtab", module, 0);

	// Create the virtual table as 'state' directly (no more _impl suffix or view layer)
	sqlite.exec(
		`CREATE VIRTUAL TABLE IF NOT EXISTS state_all USING state_vtab();`
	);

	// Create state view that filters to active version only
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS state AS
		SELECT 
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content,
			schema_version,
			created_at,
			updated_at,
			inherited_from_version_id,
			change_id,
			untracked,
			change_set_id
		FROM state_all
		WHERE version_id IN (SELECT version_id FROM active_version);

		-- Add INSTEAD OF triggers for state that forward to state virtual table
		CREATE TRIGGER IF NOT EXISTS state_insert
		INSTEAD OF INSERT ON state
		BEGIN
			INSERT INTO state_all (
				entity_id,
				schema_key,
				file_id,
				version_id,
				plugin_key,
				snapshot_content,
				schema_version,
				created_at,
				updated_at,
				inherited_from_version_id,
				change_id,
				untracked,
				change_set_id
			) VALUES (
				NEW.entity_id,
				NEW.schema_key,
				NEW.file_id,
				(SELECT version_id FROM active_version),
				NEW.plugin_key,
				NEW.snapshot_content,
				NEW.schema_version,
				NEW.created_at,
				NEW.updated_at,
				NEW.inherited_from_version_id,
				NEW.change_id,
				NEW.untracked,
				NEW.change_set_id
			);
		END;

		CREATE TRIGGER IF NOT EXISTS state_update
		INSTEAD OF UPDATE ON state	
		BEGIN
			UPDATE state_all
			SET
				entity_id = NEW.entity_id,
				schema_key = NEW.schema_key,
				file_id = NEW.file_id,
				version_id = (SELECT version_id FROM active_version),
				plugin_key = NEW.plugin_key,
				snapshot_content = NEW.snapshot_content,
				schema_version = NEW.schema_version,
				created_at = NEW.created_at,
				updated_at = NEW.updated_at,
				inherited_from_version_id = NEW.inherited_from_version_id,
				change_id = NEW.change_id,
				untracked = NEW.untracked,
				change_set_id = NEW.change_set_id
			WHERE
				entity_id = OLD.entity_id
				AND schema_key = OLD.schema_key
				AND file_id = OLD.file_id
				AND version_id = (SELECT version_id FROM active_version);
		END;

		CREATE TRIGGER IF NOT EXISTS state_delete
		INSTEAD OF DELETE ON state
		BEGIN
			DELETE FROM state_all
			WHERE 
				entity_id = OLD.entity_id
				AND schema_key = OLD.schema_key
				AND file_id = OLD.file_id
				AND version_id = (SELECT version_id FROM active_version);
		END;
	`);

	// Create the cache table for performance optimization and the untracked state table
	const sql = `
  -- Table for untracked state that bypasses change control
  CREATE TABLE IF NOT EXISTS internal_state_all_untracked (
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content TEXT NOT NULL, -- JSON content
    schema_version TEXT NOT NULL,
    created_at TEXT DEFAULT (lix_timestamp()) NOT NULL CHECK (created_at LIKE '%Z'),
    updated_at TEXT DEFAULT (lix_timestamp()) NOT NULL CHECK (updated_at LIKE '%Z'),
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  ) STRICT;

  -- Trigger to update updated_at on untracked state changes
  CREATE TRIGGER IF NOT EXISTS internal_state_all_untracked_update_timestamp
  AFTER UPDATE ON internal_state_all_untracked
  BEGIN
    UPDATE internal_state_all_untracked 
    SET updated_at = lix_timestamp()
    WHERE entity_id = NEW.entity_id 
      AND schema_key = NEW.schema_key 
      AND file_id = NEW.file_id 
      AND version_id = NEW.version_id;
  END;
`;

	return sqlite.exec(sql);
}

export function handleStateDelete(
	sqlite: SqliteWasmDatabase,
	rowId: number,
	db: Kysely<LixInternalDatabaseSchema>
): void {
	const rowToDelete = sqlite.exec({
		sql: "SELECT * FROM state_all WHERE rowid = ?",
		bind: [rowId],
		returnValue: "resultRows",
	})[0]!;

	const entity_id = rowToDelete[0];
	const schema_key = rowToDelete[1];
	const file_id = rowToDelete[2];
	const version_id = rowToDelete[3];
	const plugin_key = rowToDelete[4];
	const snapshot_content = rowToDelete[5];
	const schema_version = rowToDelete[6];
	// Column indices: created_at[7], updated_at[8], inherited_from_version_id[9], change_id[10], untracked[11]
	const untracked = rowToDelete[11];

	// If entity is untracked, just delete it without creating changes
	if (untracked) {
		// Delete from untracked table
		sqlite.exec({
			sql: `DELETE FROM internal_state_all_untracked 
				  WHERE entity_id = ? AND schema_key = ? AND file_id = ? AND version_id = ?`,
			bind: [
				String(entity_id),
				String(schema_key),
				String(file_id),
				String(version_id),
			],
		});
		return;
	}

	const storedSchema = getStoredSchema(sqlite, schema_key);

	validateStateMutation({
		lix: { sqlite, db: db as any },
		schema: storedSchema ? JSON.parse(storedSchema) : null,
		snapshot_content: JSON.parse(snapshot_content as string),
		operation: "delete",
		entity_id: String(entity_id),
		version_id: String(version_id),
	});

	handleStateMutation(
		sqlite,
		db,
		String(entity_id),
		String(schema_key),
		String(file_id),
		String(plugin_key),
		null, // No snapshot content for DELETE
		String(version_id),
		String(schema_version)
	);
}

// Helper functions for the virtual table

function getStoredSchema(
	sqlite: SqliteWasmDatabase,
	schemaKey: any
): string | null {
	const result = sqlite.exec({
		sql: "SELECT value FROM stored_schema WHERE key = ?",
		bind: [String(schemaKey)],
		returnValue: "resultRows",
	});

	return result && result.length > 0 ? (result[0]![0] as string) : null;
}

function getColumnName(columnIndex: number): string {
	const columns = [
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
		"change_set_id",
	];
	return columns[columnIndex] || "unknown";
}

export type StateView = Omit<StateAllView, "version_id">;

export type StateAllView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: Record<string, any>;
	schema_version: string;
	version_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
	inherited_from_version_id: string | null;
	change_id: Generated<string>;
	untracked: Generated<boolean>;
	change_set_id: Generated<string>;
};

export type InternalStateAllUntrackedTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string; // JSON string, not null for untracked
	schema_version: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
};

// Kysely operation types
export type StateRow = Selectable<StateView>;
export type NewStateRow = Insertable<StateView>;
export type StateRowUpdate = Updateable<StateView>;

export type StateAllRow = Selectable<StateAllView>;
export type NewStateAllRow = Insertable<StateAllView>;
export type StateAllRowUpdate = Updateable<StateAllView>;

// Types for the internal_change TABLE
export type InternalChangeInTransaction =
	Selectable<InternalChangeInTransactionTable>;
export type NewInternalChangeInTransaction =
	Insertable<InternalChangeInTransactionTable>;
export type InternalChangeInTransactionTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	version_id: string;
	snapshot_content: Record<string, any> | null;
	created_at: Generated<string>;
};
