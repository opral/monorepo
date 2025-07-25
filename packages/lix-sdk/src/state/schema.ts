import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import { sql } from "kysely";
import { handleStateMutation } from "./handle-state-mutation.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import { executeSync } from "../database/execute-sync.js";
import {
	applyMaterializeStateSchema,
	materializeState,
} from "./materialize-state.js";
import { applyResolvedStateView } from "./resolved-state-view.js";
import { applyStateCacheSchema } from "./cache/schema.js";
import { isStaleStateCache } from "./cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "./cache/mark-state-cache-as-stale.js";
import { commit } from "./commit.js";
import { parseStatePk, serializeStatePk } from "./primary-key.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { LixLogSchema } from "../log/schema.js";
import { shouldLog } from "../log/create-lix-own-log.js";
// import { createLixOwnLogSync } from "../log/create-lix-own-log.js";

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
	change_set_id TEXT
) WITHOUT ROWID;`;

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	hooks: LixHooks
): void {
	applyMaterializeStateSchema(sqlite);
	applyStateCacheSchema({ sqlite });
	applyResolvedStateView({ sqlite, db });

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

	// Guard flag to prevent recursion when logging
	let loggingIsInProgress = false;

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
					"change_set_id", // 13
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
					const cacheIsStale = isStaleStateCache({
						lix: { sqlite, db: db as any },
					});

					// Try cache first - but only if it's not stale
					let cacheResults: any[] | null = null;
					if (!cacheIsStale) {
						// Select directly from resolved state view using Kysely
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
													snapshot_content: isDeletion
														? null
														: snapshot_content,
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
								// Log the cache miss immediately (guard flag will prevent recursion)
								insertVTableLog({
									sqlite,
									db: db as any,
									key: "lix_state_cache_miss",
									level: "debug",
									message: `Cache miss detected - materialized state`,
								});
								// Mark cache as fresh after population
								isUpdatingCacheState = true;
								try {
									markStateCacheAsFresh({ lix: { sqlite, db: db as any } });
								} finally {
									isUpdatingCacheState = false;
								}
							}
						}

						// After populating cache, query from resolved state view
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
					// Extract arguments using the proper SQLite WASM API
					const args = sqlite.sqlite3.capi.sqlite3_values_to_js(nArg, ppArgv);

					// DELETE operation: nArg = 1, args[0] = old primary key
					if (nArg === 1) {
						const oldPk = args[0] as string;
						if (!oldPk) {
							throw new Error("Missing primary key for DELETE operation");
						}

						// Parse primary key to determine tag and extract values
						const parsed = parseStatePk(oldPk);

						// Route based on tag
						if (parsed.tag === "U") {
							// Delete from untracked table - direct untracked entity
							executeSync({
								lix: { sqlite },
								query: db
									.deleteFrom("internal_state_all_untracked")
									.where("entity_id", "=", parsed.entityId)
									.where("file_id", "=", parsed.fileId)
									.where("version_id", "=", parsed.versionId),
							});
						} else if (parsed.tag === "UI") {
							// For inherited untracked, we need to create a tombstone
							// Get the row data first
							const rowToDelete = executeSync({
								lix: { sqlite },
								query: db
									.selectFrom("internal_resolved_state_all")
									.select([
										"entity_id",
										"schema_key",
										"file_id",
										"version_id",
										"plugin_key",
										"schema_version",
									])
									.where("_pk", "=", oldPk),
							})[0];

							if (rowToDelete) {
								// Call insertTransactionState with null snapshot to create tombstone
								insertTransactionState({
									lix: { sqlite, db },
									data: {
										entity_id: rowToDelete.entity_id,
										schema_key: rowToDelete.schema_key,
										file_id: rowToDelete.file_id,
										plugin_key: rowToDelete.plugin_key,
										snapshot_content: null, // Deletion
										schema_version: rowToDelete.schema_version,
										version_id: rowToDelete.version_id,
										untracked: true,
									},
								});
							}
						} else if (parsed.tag === "C" || parsed.tag === "CI") {
							// For tracked state, use handleStateDelete
							handleStateDelete(sqlite, oldPk, db);
						}

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
					const storedSchema = getStoredSchema(sqlite, db, schema_key);

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
					insertVTableLog({
						sqlite,
						db: db as any,
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
	sqlite.exec(`
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
`);

	/**
	 * Insert a log entry directly using insertTransactionState to avoid recursion
	 * when logging from within the virtual table methods.
	 */
	function insertVTableLog(args: {
		sqlite: SqliteWasmDatabase;
		db: Kysely<LixInternalDatabaseSchema>;
		key: string;
		message: string;
		level: string;
	}): void {
		if (loggingIsInProgress) {
			return;
		}
		// preventing recursivly logging that we inserted a log entry
		// with this flag
		loggingIsInProgress = true;
		// Check log levels directly from internal state tables to avoid recursion
		const logLevelsResult = executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.selectFrom("internal_resolved_state_all")
				.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
				.where("schema_key", "=", "lix_key_value")
				.where(
					sql`json_extract(snapshot_content, '$.key')`,
					"=",
					"lix_log_levels"
				)
				.limit(1),
		});

		const logLevelsValue = logLevelsResult[0]?.value;

		// Check if the level is allowed
		if (!shouldLog(logLevelsValue as string[] | undefined, args.level)) {
			return;
		}

		// Create log entry data
		const lix = { sqlite: args.sqlite, db: args.db } as any;
		const logData = {
			id: uuidV7({ lix }),
			key: args.key,
			message: args.message,
			level: args.level,
		};

		// Insert log using insertTransactionState
		insertTransactionState({
			lix,
			data: {
				entity_id: logData.id,
				schema_key: LixLogSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify(logData),
				schema_version: LixLogSchema["x-lix-version"],
				// Using global and untracked for vtable logs.
				// if we need to track them, we can change this later
				version_id: "global",
				untracked: true,
			},
		});
		loggingIsInProgress = false;
	}
}

export function handleStateDelete(
	sqlite: SqliteWasmDatabase,
	primaryKey: string,
	db: Kysely<LixInternalDatabaseSchema>
): void {
	// Query the row to delete using the resolved state view with Kysely
	const rowToDelete = executeSync({
		lix: { sqlite },
		query: db
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

	// If entity is untracked, just delete it without creating changes
	if (untracked) {
		// Delete from untracked table
		executeSync({
			lix: { sqlite },
			query: db
				.deleteFrom("internal_state_all_untracked")
				.where("entity_id", "=", String(entity_id))
				.where("schema_key", "=", String(schema_key))
				.where("file_id", "=", String(file_id))
				.where("version_id", "=", String(version_id)),
		});
		return;
	}

	const storedSchema = getStoredSchema(sqlite, db, schema_key);

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
	db: Kysely<LixInternalDatabaseSchema>,
	schemaKey: any
): string | null {
	// Query directly from internal_resolved_state_all to avoid vtable recursion
	const result = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("internal_resolved_state_all")
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
			.where("schema_key", "=", "lix_stored_schema")
			.where(
				sql`json_extract(snapshot_content, '$.key')`,
				"=",
				String(schemaKey)
			)
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
