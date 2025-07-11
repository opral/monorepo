import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import { handleStateMutation } from "./handle-state-mutation.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import { createChangesetForTransaction } from "./create-changeset-for-transaction.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import { executeSync } from "../database/execute-sync.js";

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
				// assert that we are not already in a transaction (the internal_change_in_transaction table is empty)
				const existingChangesInTransaction = executeSync({
					lix: { sqlite },
					query: db.selectFrom("internal_change_in_transaction").selectAll(),
				});
				if (existingChangesInTransaction.length > 0) {
					const errorMessage = "Transaction already in progress";
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_xbegin_error",
							level: "error",
							message: `xBegin error: ${errorMessage}`,
						});
					}
					throw new Error(errorMessage);
				}
			},

			xCommit: () => {
				const currentTime = new Date().toISOString();

				// Insert each row from internal_change_in_transaction into internal_snapshot and internal_change,
				// using the same id for snapshot_id in internal_change as in internal_snapshot.
				const changesWithoutChangeSets = sqlite.exec({
					sql: `
						SELECT 
							id, 
							entity_id, 
							schema_key, 
							schema_version, 
							file_id, 
							plugin_key, 
							version_id, 
							CASE 
								WHEN snapshot_content IS NOT NULL THEN json(snapshot_content) 
								ELSE NULL 
							END as snapshot_content, 
							created_at 
						FROM internal_change_in_transaction 
						ORDER BY version_id
					`,
					returnValue: "resultRows",
				});

				// Group changes by version_id
				const changesByVersion = new Map<
					string,
					{
						id: string;
						entity_id: string;
						schema_key: string;
						schema_version: string;
						file_id: string;
						plugin_key: string;
						created_at: string;
						snapshot_content: string | null;
					}[]
				>();
				for (const changeWithoutChangeset of changesWithoutChangeSets) {
					const version_id = changeWithoutChangeset[6] as string;
					if (!changesByVersion.has(version_id)) {
						changesByVersion.set(version_id, []);
					}
					changesByVersion.get(version_id)!.push({
						id: changeWithoutChangeset[0] as string,
						entity_id: changeWithoutChangeset[1] as string,
						schema_key: changeWithoutChangeset[2] as string,
						schema_version: changeWithoutChangeset[3] as string,
						file_id: changeWithoutChangeset[4] as string,
						plugin_key: changeWithoutChangeset[5] as string,
						snapshot_content: changeWithoutChangeset[7] as string,
						created_at: changeWithoutChangeset[8] as string,
					});
				}

				// Process each version's changes to create changesets
				const changesetIdsByVersion = new Map<string, string>();
				for (const [version_id, versionChanges] of changesByVersion) {
					// Create changeset and edges for this version's transaction
					const changesetId = createChangesetForTransaction(
						sqlite,
						db as any,
						currentTime,
						version_id,
						versionChanges
					);
					changesetIdsByVersion.set(version_id, changesetId);
				}

				const changesToRealize = sqlite.exec({
					sql: "SELECT id, entity_id, schema_key, schema_version, file_id, plugin_key, version_id, snapshot_content, created_at FROM internal_change_in_transaction ORDER BY version_id",
					returnValue: "resultRows",
				});

				for (const changeToRealize of changesToRealize) {
					const [
						id,
						entity_id,
						schema_key,
						schema_version,
						file_id,
						plugin_key,
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						version_id,
						snapshot_content,
						created_at,
					] = changeToRealize;

					let snapshot_id = "no-content";

					if (snapshot_content) {
						// Insert into internal_snapshot
						const result = sqlite.exec({
							sql: `INSERT OR IGNORE INTO internal_snapshot (content) VALUES (?) RETURNING id`,
							bind: [snapshot_content],
							returnValue: "resultRows",
						});
						// Get the 'id' column of the newly created row
						if (result && result.length > 0) {
							snapshot_id = result[0]![0] as string; // assuming 'id' is the first column
						}
					}

					// Insert into internal_change
					sqlite.exec({
						sql: `INSERT INTO internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
							   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
						bind: [
							id,
							entity_id,
							schema_key,
							schema_version,
							file_id,
							plugin_key,
							snapshot_id,
							created_at,
						],
						returnValue: "resultRows",
					});
				}

				sqlite.exec({
					sql: "DELETE FROM internal_change_in_transaction",
					returnValue: "resultRows",
				});

				// Update cache entries with the changeset IDs
				for (const [version_id, changesetId] of changesetIdsByVersion) {
					sqlite.exec({
						sql: `UPDATE internal_state_cache 
						      SET change_set_id = ? 
						      WHERE version_id = ? AND change_set_id IS NULL`,
						bind: [changesetId, version_id],
					});
				}

				// Emit state commit hook after transaction is successfully committed
				hooks._emit("state_commit");

				return capi.SQLITE_OK;
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

				// Try cache first - include inherited entities via union
				const cacheResults = selectFromCache(sqlite, filters);

				cursorState.results = cacheResults || [];
				cursorState.rowIndex = 0;

				const recordsInCache = sqlite.exec({
					sql: `SELECT COUNT(*) as count FROM internal_state_cache`,
					returnValue: "resultRows",
				})[0]![0] as number;

				// Cache miss - populate cache with actual recursive state query

				if (cursorState.results.length === 0 && recordsInCache === 0) {
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
						if (cachePopulated && canLog()) {
							createLixOwnLogSync({
								lix: { sqlite, db: db as any },
								key: "lix_state_cache_populated",
								level: "debug",
								message: `Cache populated with ${stateResults?.length || 0} rows from CTE`,
							});
						}
					}

					// Re-query cache after population

					// Re-query after population with inheritance logic
					const newResults = selectFromCache(sqlite, filters);
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
  CREATE TABLE IF NOT EXISTS internal_state_cache (
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content TEXT, -- Allow NULL for deletions
    schema_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    inherited_from_version_id TEXT,
    inheritance_delete_marker INTEGER DEFAULT 0, -- Flag for copy-on-write deletion markers
    change_id TEXT, -- Allow NULL during migration and for deletion markers 
    change_set_id TEXT, -- Allow NULL until changeset is created at commit
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  );

  -- Table for untracked state that bypasses change control
  CREATE TABLE IF NOT EXISTS internal_state_all_untracked (
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content TEXT NOT NULL, -- JSON content
    schema_version TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (created_at LIKE '%Z'),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (updated_at LIKE '%Z'),
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  ) STRICT;

  -- Trigger to update updated_at on untracked state changes
  CREATE TRIGGER IF NOT EXISTS internal_state_all_untracked_update_timestamp
  AFTER UPDATE ON internal_state_all_untracked
  BEGIN
    UPDATE internal_state_all_untracked 
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
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

function materializeState(
	sqlite: SqliteWasmDatabase,
	filters: Record<string, string>,
	includeDeletions: boolean = false
): any[] {
	let sql = `
		/* -----------------------------  CTEs  --------------------------------- */
		WITH
			/*  Collect every committed or in-flight change with its snapshot */
			all_changes_with_snapshots AS (
				SELECT 
					ic.id,
					ic.entity_id,
					ic.schema_key,
					ic.file_id,
					ic.plugin_key,
					ic.schema_version,
					ic.created_at,
					CASE WHEN ic.snapshot_id = 'no-content' THEN NULL
					     ELSE json(s.content)
					END AS snapshot_content
				FROM internal_change ic
				LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id

				UNION ALL

				SELECT 
					ict.id,
					ict.entity_id,
					ict.schema_key,
					ict.file_id,
					ict.plugin_key,
					ict.schema_version,
					ict.created_at,
					ict.snapshot_content
				FROM internal_change_in_transaction ict

				UNION ALL

				SELECT 
					'untracked-'||unt.entity_id||'-'||unt.schema_key,
					unt.entity_id,
					unt.schema_key,
					unt.file_id,
					unt.plugin_key,
					unt.schema_version,
					unt.created_at,
					json(unt.snapshot_content) AS snapshot_content
				FROM internal_state_all_untracked unt
			),

			/* Discover every change-set reachable from ANY version root */
			root_cs_of_all_versions AS (
				SELECT 
					json_extract(v.snapshot_content,'$.change_set_id') AS version_change_set_id,
					v.entity_id AS version_id
				FROM all_changes_with_snapshots v
				WHERE v.schema_key = 'lix_version'
			),
			reachable_cs_from_roots(id, version_id) AS (
				SELECT 
					version_change_set_id, 
					version_id 
				FROM root_cs_of_all_versions
				
				UNION
				
				SELECT 
					json_extract(edge.snapshot_content,'$.child_id'), 
					r.version_id
				FROM all_changes_with_snapshots edge
				JOIN reachable_cs_from_roots r ON json_extract(edge.snapshot_content,'$.parent_id') = r.id
				WHERE edge.schema_key = 'lix_change_set_edge'
			),

			/*  Calculate depth of each reachable change-set within *its* version DAG */
			cs_depth AS (
				SELECT 
					id, 
					version_id, 
					0 AS depth
				FROM reachable_cs_from_roots

				UNION ALL

				SELECT 
					json_extract(edge.snapshot_content,'$.child_id') AS id,
					r.version_id AS version_id,
					d.depth + 1 AS depth
				FROM all_changes_with_snapshots edge
				JOIN cs_depth d ON json_extract(edge.snapshot_content,'$.parent_id') = d.id
				JOIN reachable_cs_from_roots r ON r.id = d.id  -- ensure same reachable set
				WHERE edge.schema_key = 'lix_change_set_edge'
			),

			/* Map entities that belong to those change-sets */
			cse_in_reachable_cs AS (
				SELECT 
					json_extract(ias.snapshot_content,'$.entity_id') AS target_entity_id,
					json_extract(ias.snapshot_content,'$.file_id') AS target_file_id,
					json_extract(ias.snapshot_content,'$.schema_key') AS target_schema_key,
					json_extract(ias.snapshot_content,'$.change_id') AS target_change_id,
					json_extract(ias.snapshot_content,'$.change_set_id') AS cse_origin_change_set_id,
					rcs.version_id
				FROM all_changes_with_snapshots ias
				JOIN reachable_cs_from_roots rcs ON json_extract(ias.snapshot_content,'$.change_set_id') = rcs.id
				WHERE ias.schema_key = 'lix_change_set_element'
			),

			/* Select the leaf change for every entity in every version */
			leaf_target_snapshots AS (
				SELECT 
					target_change.entity_id,
					target_change.schema_key,
					target_change.file_id,
					target_change.plugin_key,
					target_change.snapshot_content,
					target_change.schema_version,
					r.version_id,
					target_change.created_at,
					target_change.id AS change_id,
					r.cse_origin_change_set_id AS change_set_id
				FROM cse_in_reachable_cs r
				JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
				WHERE NOT EXISTS (
					/* any *newer* change for the same entity in a *descendant* CS */
					WITH RECURSIVE descendants_of_current_cs(id) AS (
						SELECT r.cse_origin_change_set_id
						UNION
						SELECT json_extract(edge.snapshot_content,'$.child_id')
						FROM   all_changes_with_snapshots edge
						JOIN   descendants_of_current_cs d ON json_extract(edge.snapshot_content,'$.parent_id') = d.id
						WHERE  edge.schema_key = 'lix_change_set_edge'
						  AND  json_extract(edge.snapshot_content,'$.child_id') IN (
						         SELECT id FROM reachable_cs_from_roots WHERE version_id = r.version_id
						       )
					)
					SELECT 1
					FROM   cse_in_reachable_cs newer_r
					WHERE  newer_r.target_entity_id  = r.target_entity_id
					  AND  newer_r.target_file_id    = r.target_file_id
					  AND  newer_r.target_schema_key = r.target_schema_key
					  AND  newer_r.version_id        = r.version_id
					  AND  newer_r.target_change_id != r.target_change_id
					  AND  newer_r.cse_origin_change_set_id IN descendants_of_current_cs
				)
			),

			/* Version inheritance */
			version_inheritance AS (
				SELECT DISTINCT 
					v.entity_id AS version_id,
					json_extract(v.snapshot_content,'$.inherits_from_version_id') AS parent_version_id
				FROM all_changes_with_snapshots v
				WHERE v.schema_key = 'lix_version'
			),

			/* Combine direct and inherited entities */
			all_entities AS (
				/* direct */
				SELECT 
					entity_id, 
					schema_key, 
					file_id, 
					plugin_key, 
					snapshot_content, 
					schema_version,
					version_id, 
					version_id AS visible_in_version, 
					NULL AS inherited_from_version_id,
					created_at, 
					change_id, 
					change_set_id
				FROM leaf_target_snapshots

				UNION ALL

				/* inherited */
				SELECT 
					ls.entity_id, 
					ls.schema_key, 
					ls.file_id, 
					ls.plugin_key, 
					ls.snapshot_content, 
					ls.schema_version,
					vi.version_id, 
					vi.version_id AS visible_in_version, 
					vi.parent_version_id AS inherited_from_version_id,
					ls.created_at, 
					ls.change_id, 
					ls.change_set_id
				FROM version_inheritance vi
				JOIN leaf_target_snapshots ls ON ls.version_id = vi.parent_version_id
				WHERE vi.parent_version_id IS NOT NULL
				  AND ls.snapshot_content IS NOT NULL /* don't inherit deletions */
				  AND NOT EXISTS (
					/* child already changed this entity */
					SELECT 1 FROM leaf_target_snapshots child_ls
					WHERE child_ls.version_id = vi.version_id
					  AND child_ls.entity_id  = ls.entity_id
					  AND child_ls.schema_key = ls.schema_key
					  AND child_ls.file_id    = ls.file_id
				  )
			),

			/* Deduplicate: prefer direct, then deepest CS */
			prioritized_entities AS (
				SELECT *,
					   ROW_NUMBER() OVER (
					     PARTITION BY entity_id, schema_key, file_id, visible_in_version
					     ORDER BY CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END,
					              (
					                SELECT depth
					                FROM   cs_depth
					                WHERE  cs_depth.id = change_set_id
					                  AND  cs_depth.version_id = visible_in_version
					              ) DESC,
					              change_id DESC  /* deterministic fall-back, should rarely fire */
					   ) AS rn
				FROM   all_entities
				${includeDeletions ? `` : `WHERE snapshot_content IS NOT NULL`}
			)
		/* ---------------------- final projection ------------------------------ */
		SELECT 
			pe.entity_id,
			pe.schema_key,
			pe.file_id,
			pe.plugin_key,
			pe.snapshot_content,
			pe.schema_version,
			pe.version_id,
			COALESCE(
				(SELECT MIN(ac.created_at) 
				 FROM all_changes_with_snapshots ac
				 JOIN cse_in_reachable_cs cse 
				   ON cse.target_change_id = ac.id
				 WHERE ac.entity_id = pe.entity_id 
				   AND ac.schema_key = pe.schema_key 
				   AND ac.file_id = pe.file_id
				   AND cse.version_id = pe.version_id),
				pe.created_at
			) AS created_at,
			COALESCE(
				(SELECT MAX(ac.created_at) 
				 FROM all_changes_with_snapshots ac
				 JOIN cse_in_reachable_cs cse 
				   ON cse.target_change_id = ac.id
				 WHERE ac.entity_id = pe.entity_id 
				   AND ac.schema_key = pe.schema_key 
				   AND ac.file_id = pe.file_id
				   AND cse.version_id = pe.version_id),
				pe.created_at
			) AS updated_at,
			pe.inherited_from_version_id,
			pe.change_id,
			COALESCE(pe.change_set_id,'untracked') AS change_set_id
		FROM prioritized_entities pe
		WHERE pe.rn = 1
	`;

	/* ------------------------ dynamic filters ------------------------------ */
	const bindings: string[] = [];
	Object.entries(filters).forEach(([col, val]) => {
		sql += `\n      AND ${col} = ?`;
		bindings.push(val);
	});

	return sqlite.exec({ sql, bind: bindings, returnValue: "resultRows" });
}

function selectFromCache(
	sqlite: SqliteWasmDatabase,
	filters: Record<string, any>
): any[] {
	const filterBindings = Object.values(filters);
	const buildWhereClause = (tableAlias: string = "") => {
		const conditions: string[] = [];
		const prefix = tableAlias ? `${tableAlias}.` : "";

		Object.keys(filters).forEach((column) => {
			conditions.push(`${prefix}${column} = ?`);
		});

		return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	};

	const statement = `SELECT * FROM (
		-- 1. Untracked state (highest priority)
		SELECT 
			rowid,
			entity_id, 
			schema_key, 
			file_id, 
			version_id, 
			plugin_key,
			snapshot_content, 
			schema_version, 
			created_at, 
			updated_at,
			NULL as inherited_from_version_id, 
			'untracked' as change_id, 
			1 as untracked,
			'untracked' as change_set_id
		FROM internal_state_all_untracked
		
		UNION ALL
		
		-- 2. Tracked state (second priority) - only if no untracked exists
		SELECT 
			rowid,
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
			0 as untracked,
			change_set_id
		FROM internal_state_cache
		WHERE inheritance_delete_marker = 0  -- Hide copy-on-write deletions
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked unt
			WHERE unt.entity_id = internal_state_cache.entity_id
			  AND unt.schema_key = internal_state_cache.schema_key
			  AND unt.file_id = internal_state_cache.file_id
			  AND unt.version_id = internal_state_cache.version_id
		)
		
		UNION ALL
		
		-- 3. Inherited tracked state (lower priority) - only if no untracked or tracked exists
		SELECT 
			rowid,
			isc.entity_id, 
			isc.schema_key, 
			isc.file_id, 
			vi.version_id, -- Return child version_id
			isc.plugin_key, 
			isc.snapshot_content, 
			isc.schema_version, 
			isc.created_at, 
			isc.updated_at,
			vi.parent_version_id as inherited_from_version_id, 
			isc.change_id, 
			0 as untracked,
			isc.change_set_id
		FROM (
			-- Get version inheritance relationships from cache
			SELECT 
				json_extract(isc_v.snapshot_content, '$.id') AS version_id,
				json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
			FROM internal_state_cache isc_v
			WHERE isc_v.schema_key = 'lix_version'
		) vi
		JOIN internal_state_cache isc ON isc.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		-- Only inherit entities that exist (not deleted) in parent
		AND isc.inheritance_delete_marker = 0
		-- Don't inherit if child has tracked state
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_cache child_isc
			WHERE child_isc.version_id = vi.version_id
			  AND child_isc.entity_id = isc.entity_id
			  AND child_isc.schema_key = isc.schema_key
			  AND child_isc.file_id = isc.file_id
		)
		-- Don't inherit if child has untracked state
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked unt
			WHERE unt.version_id = vi.version_id
			  AND unt.entity_id = isc.entity_id
			  AND unt.schema_key = isc.schema_key
			  AND unt.file_id = isc.file_id
		)
		
		UNION ALL
		
		-- 4. Inherited untracked state (lowest priority) - only if no untracked or tracked exists
		SELECT 
			rowid,
			unt.entity_id, 
			unt.schema_key, 
			unt.file_id, 
			vi.version_id, -- Return child version_id
			unt.plugin_key, 
			unt.snapshot_content, 
			unt.schema_version, 
			unt.created_at, 
			unt.updated_at,
			vi.parent_version_id as inherited_from_version_id, 
			'untracked' as change_id, 
			1 as untracked,
			'untracked' as change_set_id
		FROM (
			-- Get version inheritance relationships from cache
			SELECT 
				json_extract(isc_v.snapshot_content, '$.id') AS version_id,
				json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
			FROM internal_state_cache isc_v
			WHERE isc_v.schema_key = 'lix_version'
		) vi
		JOIN internal_state_all_untracked unt ON unt.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		-- Don't inherit if child has tracked state
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_cache child_isc
			WHERE child_isc.version_id = vi.version_id
			  AND child_isc.entity_id = unt.entity_id
			  AND child_isc.schema_key = unt.schema_key
			  AND child_isc.file_id = unt.file_id
		)
		-- Don't inherit if child has untracked state
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked child_unt
			WHERE child_unt.version_id = vi.version_id
			  AND child_unt.entity_id = unt.entity_id
			  AND child_unt.schema_key = unt.schema_key
			  AND child_unt.file_id = unt.file_id
		)
	) as combined_results`;

	const result = sqlite.exec({
		sql: `${statement} ${buildWhereClause("combined_results")}`,
		bind: [...filterBindings],
		returnValue: "resultRows",
	});

	return result;
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

// Cache table type (internal table for state materialization)
export type InternalStateCacheTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // JSON string, NULL for deletions
	schema_version: string;
	created_at: string;
	updated_at: string;
	inherited_from_version_id: string | null;
	inheritance_delete_marker: number; // 1 for copy-on-write deletion markers, 0 otherwise
	change_id: string;
	change_set_id: string | null;
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

export type StateCacheRow = Selectable<InternalStateCacheTable>;
export type NewStateCacheRow = Insertable<InternalStateCacheTable>;
export type StateCacheRowUpdate = Updateable<InternalStateCacheTable>;

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
