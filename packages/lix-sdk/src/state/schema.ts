import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import type { JSONType } from "../schema-definition/json-type.js";
import { handleStateMutation } from "./handle-state-mutation.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>
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

	const create_temp_change_table_sql = `
  -- add a table we use within the transaction
  CREATE TEMP TABLE IF NOT EXISTS internal_change_in_transaction (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content BLOB,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (created_at LIKE '%Z'),
	--- NOTE schena_key must be unique per entity_id and file_id
	-- TODO add version column to avoid conflicts within differetn versions
	UNIQUE(entity_id, file_id, schema_key)
  ) STRICT;

`;

	sqlite.exec(create_temp_change_table_sql);

	module.installMethods(
		{
			xCreate: (db: any, _pAux: any, _argc: number, _argv: any, pVTab: any) => {
				const sql = `CREATE TABLE x(
				entity_id TEXT,
				schema_key TEXT,
				file_id TEXT,
				version_id TEXT,
				plugin_key TEXT,
				snapshot_content TEXT,
				schema_version TEXT,
				created_at TEXT,
				updated_at TEXT
			)`;

				const result = capi.sqlite3_declare_vtab(db, sql);
				if (result !== capi.SQLITE_OK) {
					return result;
				}

				sqlite.sqlite3.vtab.xVtab.create(pVTab);
				return capi.SQLITE_OK;
			},

			xConnect: () => {
				return capi.SQLITE_OK;
			},

			xBegin: () => {
				// assert that we are not already in a transaction (the internal_change_in_transaction table is empty)
				if (
					sqlite.exec({
						sql: "SELECT * FROM internal_change_in_transaction",
						returnValue: "resultRows",
					}).length > 0
				) {
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
				// Insert each row from internal_change_in_transaction into internal_snapshot and internal_change,
				// using the same id for snapshot_id in internal_change as in internal_snapshot.
				const rows = sqlite.exec({
					sql: "SELECT id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_content, created_at FROM internal_change_in_transaction",
					returnValue: "resultRows",
				});

				for (const row of rows) {
					const [
						id,
						entity_id,
						schema_key,
						schema_version,
						file_id,
						plugin_key,
						snapshot_content,
						created_at,
					] = row;

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
						sql: `INSERT OR IGNORE INTO internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
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
					});
				}

				sqlite.exec({
					sql: "DELETE FROM internal_change_in_transaction",
					returnValue: "resultRows",
				});

				return capi.SQLITE_OK;
			},

			xRollback: () => {
				sqlite.exec({
					sql: "DELETE FROM internal_change_in_transaction",
					returnValue: "resultRows",
				});
			},

			xBestIndex: () => {
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

			xFilter: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);

				// Try cache first
				const cacheResults = sqlite.exec({
					sql: "SELECT * FROM internal_state_cache",
					returnValue: "resultRows",
				});

				cursorState.results = cacheResults || [];
				cursorState.rowIndex = 0;

				// Cache miss - populate cache with actual recursive state query
				if (cursorState.results.length === 0) {
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_cache_miss",
							level: "debug",
							message: `Cache miss detected - materializing state from CTE`,
						});
					}

					// Run the expensive recursive CTE to materialize state
					const stateResults = selectStateViaCTE(sqlite, {});

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

							// Skip rows with null entity_id (no actual state data found)
							if (!entity_id) {
								continue;
							}

							sqlite.exec({
								sql: `INSERT OR REPLACE INTO internal_state_cache 
									  (entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, created_at, updated_at)
									  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
								bind: [
									entity_id,
									schema_key,
									file_id,
									version_id,
									plugin_key,
									typeof snapshot_content === "string"
										? snapshot_content
										: JSON.stringify(snapshot_content),
									schema_version,
									created_at,
									updated_at,
								],
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

					// Re-query after population
					const newResults = sqlite.exec({
						sql: "SELECT * FROM internal_state_cache",
						returnValue: "resultRows",
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
					value = row[iCol];
				} else {
					const columnName = getColumnName(iCol);
					value = row[columnName];
				}

				if (typeof value === "object") {
					capi.sqlite3_result_js(pContext, JSON.stringify(value));
				} else {
					capi.sqlite3_result_js(pContext, value);
				}

				return capi.SQLITE_OK;
			},

			xRowid: (pCursor: any, pRowid: any) => {
				const cursorState = cursorStates.get(pCursor);
				sqlite.sqlite3.vtab.xRowid(pRowid, cursorState.rowIndex);
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

						const rowToDelete = sqlite.exec({
							sql: "SELECT * FROM state WHERE rowid = ?",
							bind: [args[0]],
							returnValue: "resultRows",
						})[0]!;

						const entity_id = rowToDelete[0];
						const schema_key = rowToDelete[1];
						const file_id = rowToDelete[2];
						const version_id = rowToDelete[3];
						const plugin_key = rowToDelete[4];
						// const snapshot_content = rowToDelete[5];
						const schema_version = rowToDelete[6];

						// TODO do we need to validate the deletion operation - foreign keys, etc.?

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

						return capi.SQLITE_OK;
					}

					// INSERT operation: nArg = N+2, args[0] = NULL, args[1] = new rowid
					// UPDATE operation: nArg = N+2, args[0] = old rowid, args[1] = new rowid
					const isInsert = args[0] === null || args[0] === undefined;
					const isUpdate = args[0] !== null && args[0] !== undefined;

					if (!isInsert && !isUpdate) {
						throw new Error("Invalid xUpdate operation");
					}

					// Extract column values (args[2] through args[N+1])
					// Column order: entity_id, schema_key, file_id, version_id, plugin_key,
					//               snapshot_content, schema_version, created_at, updated_at
					const entity_id = args[2];
					const schema_key = args[3];
					const file_id = args[4];
					const version_id = args[5];
					const plugin_key = args[6];
					const snapshot_content = args[7];
					const schema_version = args[8];

					// assert required fields
					if (!entity_id || !schema_key || !file_id || !plugin_key) {
						throw new Error("Missing required fields for state mutation");
					}

					if (!version_id) {
						throw new Error("version_id is required for state mutation");
					}

					// Ensure snapshot_content is a string
					const snapshotStr =
						typeof snapshot_content === "string"
							? snapshot_content
							: JSON.stringify(snapshot_content);

					// Call validation function (same logic as triggers)
					const storedSchemaResult = sqlite.exec({
						sql: "SELECT value FROM stored_schema WHERE key = ?",
						bind: [String(schema_key)],
						returnValue: "resultRows",
					});

					const storedSchema =
						storedSchemaResult && storedSchemaResult.length > 0
							? storedSchemaResult[0]![0]
							: null;

					validateStateMutation({
						lix: { sqlite, db: db as any },
						schema: storedSchema ? JSON.parse(storedSchema as string) : null,
						snapshot_content: JSON.parse(snapshotStr),
						operation: isInsert ? "insert" : "update",
						entity_id: String(entity_id),
						version_id: String(version_id),
					});

					// Call handleStateMutation (same logic as triggers)
					handleStateMutation(
						sqlite,
						db,
						String(entity_id),
						String(schema_key),
						String(file_id),
						String(plugin_key),
						snapshotStr,
						String(version_id),
						String(schema_version)
					);

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
	sqlite.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS state USING state_vtab();`);

	// Create the cache table for performance optimization
	const sql = `
  CREATE TABLE IF NOT EXISTS internal_state_cache (
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  );


`;

	return sqlite.exec(sql);
}

// Helper functions for the virtual table

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
	];
	return columns[columnIndex] || "unknown";
}

function selectStateViaCTE(
	sqlite: SqliteWasmDatabase,
	filters: Record<string, string>
): any[] {
	// This is the expensive CTE from the original recursive state view
	let sql = `
		WITH
			all_changes_with_snapshots AS (
				SELECT ic.id, ic.entity_id, ic.schema_key, ic.file_id, ic.plugin_key,
					   ic.rowid, ic.schema_version, json(s.content) AS snapshot_content 
				FROM internal_change ic
				LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
				WHERE ic.snapshot_id != 'no-content'
			),
			root_cs_of_all_versions AS (
				SELECT json_extract(v.snapshot_content, '$.change_set_id') AS version_change_set_id, 
					   v.entity_id AS version_id
				FROM all_changes_with_snapshots v
				WHERE v.schema_key = 'lix_version'
			),
			reachable_cs_from_roots(id, version_id) AS (
				SELECT version_change_set_id, version_id FROM root_cs_of_all_versions
				UNION
				SELECT json_extract(e.snapshot_content, '$.parent_id'), r.version_id
				FROM all_changes_with_snapshots e 
				JOIN reachable_cs_from_roots r ON json_extract(e.snapshot_content, '$.child_id') = r.id
				WHERE e.schema_key = 'lix_change_set_edge'
			),
			cse_in_reachable_cs AS (
				SELECT json_extract(ias.snapshot_content, '$.entity_id') AS target_entity_id,
					   json_extract(ias.snapshot_content, '$.file_id') AS target_file_id,
					   json_extract(ias.snapshot_content, '$.schema_key') AS target_schema_key, 
					   json_extract(ias.snapshot_content, '$.change_id') AS target_change_id,
					   json_extract(ias.snapshot_content, '$.change_set_id') AS cse_origin_change_set_id,
					   rcs.version_id
				FROM all_changes_with_snapshots ias
				JOIN reachable_cs_from_roots rcs ON json_extract(ias.snapshot_content, '$.change_set_id') = rcs.id
				WHERE ias.schema_key = 'lix_change_set_element'
			),
			leaf_target_snapshots AS (
				SELECT target_change.entity_id, target_change.schema_key, target_change.file_id,
					   target_change.plugin_key, target_change.snapshot_content AS snapshot_content,
					   target_change.schema_version, r.version_id
				FROM cse_in_reachable_cs r 
				INNER JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
				WHERE NOT EXISTS (
					WITH RECURSIVE descendants_of_current_cs(id) AS ( 
						SELECT r.cse_origin_change_set_id 
						UNION
						SELECT json_extract(edge.snapshot_content, '$.child_id')
						FROM all_changes_with_snapshots edge
						JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content, '$.parent_id') = d.id
						WHERE edge.schema_key = 'lix_change_set_edge'
						  AND json_extract(edge.snapshot_content, '$.child_id') IN (
						  	SELECT id FROM reachable_cs_from_roots WHERE version_id = r.version_id
						  )
					)
					SELECT 1 FROM cse_in_reachable_cs newer_r 
					WHERE newer_r.target_entity_id = r.target_entity_id 
					  AND newer_r.target_file_id = r.target_file_id       
					  AND newer_r.target_schema_key = r.target_schema_key 
					  AND newer_r.version_id = r.version_id
					  AND (newer_r.cse_origin_change_set_id != r.cse_origin_change_set_id OR newer_r.target_change_id != r.target_change_id) 
					  AND newer_r.cse_origin_change_set_id IN descendants_of_current_cs
				)
			)
		SELECT 
			ls.entity_id,
			ls.schema_key,
			ls.file_id,
			ls.plugin_key,
			ls.snapshot_content,
			ls.schema_version,
			ls.version_id,
      -- TODO dont use max/min here for created_at
			(SELECT MIN(ic.created_at) FROM internal_change ic 
			 WHERE ic.entity_id = ls.entity_id AND ic.schema_key = ls.schema_key AND ic.file_id = ls.file_id) AS created_at,
			(SELECT MAX(ic.created_at) FROM internal_change ic 
			 WHERE ic.entity_id = ls.entity_id AND ic.schema_key = ls.schema_key AND ic.file_id = ls.file_id
			   AND ic.id IN (SELECT cse.target_change_id FROM cse_in_reachable_cs cse WHERE cse.version_id = ls.version_id)) AS updated_at
		FROM leaf_target_snapshots ls
	`;

	const bindings: string[] = [];
	const conditions: string[] = [];

	Object.entries(filters).forEach(([key, value]) => {
		conditions.push(`ls.${key} = ?`);
		bindings.push(value);
	});

	if (conditions.length > 0) {
		sql += " WHERE " + conditions.join(" AND ");
	}

	const result = sqlite.exec({
		sql,
		bind: bindings,
		returnValue: "resultRows",
	});

	return result || [];
}

export type StateView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: JSONType;
	schema_version: string;
	version_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
};

// Cache table type (internal table for state materialization)
export type InternalStateCacheTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string; // JSON string
	schema_version: string;
	created_at: string;
	updated_at: string;
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
	snapshot_content: JSONType | null;
	created_at: Generated<string>;
};

