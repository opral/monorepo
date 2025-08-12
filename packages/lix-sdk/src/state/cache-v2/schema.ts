import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "../../lix/open-lix.js";

// Type definition for the cache v2 virtual table
export type InternalStateCacheV2Table = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // BLOB stored as string/JSON
	schema_version: string;
	created_at: string;
	updated_at: string;
	inherited_from_version_id: string | null;
	inheritance_delete_marker: number; // 0 or 1
	change_id: string | null;
	commit_id: string | null;
};

// Virtual table schema definition - matches existing internal_state_cache structure
const CACHE_VTAB_CREATE_SQL = `CREATE TABLE x(
	_pk HIDDEN TEXT NOT NULL PRIMARY KEY,
	entity_id TEXT NOT NULL,
	schema_key TEXT NOT NULL,
	file_id TEXT NOT NULL,
	version_id TEXT NOT NULL,
	plugin_key TEXT NOT NULL,
	snapshot_content BLOB,
	schema_version TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	inherited_from_version_id TEXT,
	inheritance_delete_marker INTEGER DEFAULT 0,
	change_id TEXT,
	commit_id TEXT
) WITHOUT ROWID;`;

export function applyStateCacheV2Schema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	const { sqlite } = lix;

	// Create virtual table using the proper SQLite WASM API
	const capi = sqlite.sqlite3.capi;
	const module = new capi.sqlite3_module();

	// Store cursor states - maps cursor pointer to state
	const cursorStates = new Map();

	// Cache of available physical tables - shared across all vtable operations
	const tableCache = {
		tables: null as string[] | null,
		timestamp: 0,
		TTL: 60000, // 60 seconds
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
				const result = capi.sqlite3_declare_vtab(
					dbHandle,
					CACHE_VTAB_CREATE_SQL
				);
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
				const result = capi.sqlite3_declare_vtab(
					dbHandle,
					CACHE_VTAB_CREATE_SQL
				);
				if (result !== capi.SQLITE_OK) {
					return result;
				}

				sqlite.sqlite3.vtab.xVtab.create(pVTab);
				return capi.SQLITE_OK;
			},

			xBestIndex: (pVTab: any, pIdxInfo: any) => {
				const idxInfo = sqlite.sqlite3.vtab.xIndexInfo(pIdxInfo);

				// Track which columns have equality constraints
				const usableConstraints: string[] = [];
				let argIndex = 0;

				// Column mapping (matching the CREATE TABLE order)
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
					"inheritance_delete_marker", // 11
					"change_id", // 12
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
					idxInfo.$needToFreeIdxStr = 1;

					// Lower cost when we can use filters (especially schema_key)
					// Schema_key is the most selective since it determines which table to query
					const hasSchemaKey = usableConstraints.includes("schema_key");
					// @ts-expect-error - idxInfo.$estimatedCost is not defined in the type
					idxInfo.$estimatedCost = hasSchemaKey
						? fullTableCost / 1000
						: fullTableCost / (usableConstraints.length + 1);
					// @ts-expect-error - idxInfo.$estimatedRows is not defined in the type
					idxInfo.$estimatedRows = hasSchemaKey
						? 1000
						: Math.ceil(fullTableRows / (usableConstraints.length + 1));
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
					tables: [], // List of tables to query
					currentTableIndex: 0, // Current table being queried
					currentStmt: null, // Current prepared statement
					currentRows: [], // Rows from current table
					currentRowIndex: 0, // Current row in current table
				});
				return capi.SQLITE_OK;
			},

			xClose: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				if (cursorState && cursorState.currentStmt) {
					// Finalize any active statement
					cursorState.currentStmt.finalize();
				}
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
					if (idxStr) {
						const columns = idxStr.split(",").filter((c) => c.length > 0);
						for (let i = 0; i < Math.min(columns.length, args.length); i++) {
							if (args[i] !== null) {
								filters[columns[i]!] = args[i];
							}
						}
					}
				}

				// Determine which tables to query
				if (filters.schema_key) {
					// Single schema_key - query single table
					const tableName = `internal_state_cache_${filters.schema_key}`;
					// Check if table exists
					const tableExists = sqlite.exec({
						sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
						bind: [tableName],
						returnValue: "resultRows",
					});

					if (tableExists && tableExists.length > 0) {
						cursorState.tables = [tableName];
					} else {
						cursorState.tables = [];
					}
				} else {
					// No schema_key filter - need to query all cache tables
					cursorState.tables = getPhysicalTables(sqlite, tableCache);
				}

				// Reset cursor state
				cursorState.currentTableIndex = 0;
				cursorState.currentRowIndex = 0;
				cursorState.currentRows = [];
				if (cursorState.currentStmt) {
					cursorState.currentStmt.finalize();
					cursorState.currentStmt = null;
				}

				// Load first table if available
				if (cursorState.tables.length > 0) {
					loadNextTable(sqlite, cursorState, filters);
				}

				return capi.SQLITE_OK;
			},

			xNext: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				cursorState.currentRowIndex++;

				// Check if we need to move to next table
				if (cursorState.currentRowIndex >= cursorState.currentRows.length) {
					cursorState.currentTableIndex++;
					cursorState.currentRowIndex = 0;
					cursorState.currentRows = [];

					// Finalize current statement
					if (cursorState.currentStmt) {
						cursorState.currentStmt.finalize();
						cursorState.currentStmt = null;
					}

					// Load next table if available
					if (cursorState.currentTableIndex < cursorState.tables.length) {
						// Pass empty filters since we're iterating through pre-filtered tables
						loadNextTable(sqlite, cursorState, {});
					}
				}

				return capi.SQLITE_OK;
			},

			xEof: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				return cursorState.currentTableIndex >= cursorState.tables.length ||
					(cursorState.currentTableIndex === cursorState.tables.length - 1 &&
						cursorState.currentRowIndex >= cursorState.currentRows.length)
					? 1
					: 0;
			},

			xColumn: (pCursor: any, pContext: any, iCol: number) => {
				const cursorState = cursorStates.get(pCursor);
				const row = cursorState.currentRows[cursorState.currentRowIndex];

				if (!row) {
					capi.sqlite3_result_null(pContext);
					return capi.SQLITE_OK;
				}

				// Map column index to value
				let value;
				switch (iCol) {
					case 0: // _pk - composite primary key
						value = `${row.entity_id}|${row.file_id}|${row.version_id}`;
						break;
					case 1:
						value = row.entity_id;
						break;
					case 2: // schema_key - derive from table name
						value = cursorState.tables[cursorState.currentTableIndex].replace(
							"internal_state_cache_",
							""
						);
						break;
					case 3:
						value = row.file_id;
						break;
					case 4:
						value = row.version_id;
						break;
					case 5:
						value = row.plugin_key;
						break;
					case 6:
						value = row.snapshot_content;
						break;
					case 7:
						value = row.schema_version;
						break;
					case 8:
						value = row.created_at;
						break;
					case 9:
						value = row.updated_at;
						break;
					case 10:
						value = row.inherited_from_version_id;
						break;
					case 11:
						value = row.inheritance_delete_marker;
						break;
					case 12:
						value = row.change_id;
						break;
					case 13:
						value = row.commit_id;
						break;
					default:
						value = null;
				}

				if (value === null || value === undefined) {
					capi.sqlite3_result_null(pContext);
				} else {
					capi.sqlite3_result_js(pContext, value);
				}

				return capi.SQLITE_OK;
			},

			xRowid: () => {
				// Not used - vtable doesn't use rowids
				return capi.SQLITE_ERROR;
			},

			xUpdate: (_pVTab: number, nArg: number, ppArgv: any) => {
				// Extract arguments using the proper SQLite WASM API
				const args = sqlite.sqlite3.capi.sqlite3_values_to_js(nArg, ppArgv);

				// DELETE operation: nArg = 1, args[0] = old primary key
				if (nArg === 1) {
					// Delete not implemented for cache vtable
					throw new Error("DELETE not supported on cache vtable");
				}

				// INSERT operation: nArg = N+2, args[0] = NULL, args[1] = new primary key
				// UPDATE operation: nArg = N+2, args[0] = old primary key, args[1] = new primary key
				const isInsert = args[0] === null;
				const isUpdate = args[0] !== null;

				if (!isInsert && !isUpdate) {
					throw new Error("Invalid xUpdate operation");
				}

				// Extract column values
				// For INSERT: args[0]=NULL, args[1]=NULL (new _pk), then column values starting at args[2]
				// For UPDATE: args[0]=old_pk, args[1]=new_pk, then column values starting at args[2]
				// Note: The HIDDEN _pk column value is at args[1] but we don't use it for INSERT
				// Column order (starting at args[2]): entity_id, schema_key, file_id, version_id, plugin_key,
				//               snapshot_content, schema_version, created_at, updated_at,
				//               inherited_from_version_id, inheritance_delete_marker, change_id, commit_id
				const entity_id = args[3];
				const schema_key = args[4];
				const file_id = args[5];
				const version_id = args[6];
				const plugin_key = args[7];
				const snapshot_content = args[8];
				const schema_version = args[9];
				const created_at = args[10];
				const updated_at = args[11];
				const inherited_from_version_id = args[12];
				const inheritance_delete_marker = args[13];
				const change_id = args[14];
				const commit_id = args[15];

				if (!schema_key) {
					throw new Error("schema_key is required");
				}

				// Determine physical table name
				const tableName = `internal_state_cache_${schema_key}`;

				// Create table if it doesn't exist (with retry logic for concurrent creation)
				const createTableSql = `
					CREATE TABLE IF NOT EXISTS ${tableName} (
						entity_id TEXT NOT NULL,
						file_id TEXT NOT NULL,
						version_id TEXT NOT NULL,
						plugin_key TEXT NOT NULL,
						snapshot_content BLOB,
						schema_version TEXT NOT NULL,
						created_at TEXT NOT NULL,
						updated_at TEXT NOT NULL,
						inherited_from_version_id TEXT,
						inheritance_delete_marker INTEGER DEFAULT 0,
						change_id TEXT,
						commit_id TEXT,
						PRIMARY KEY (entity_id, file_id, version_id)
					) STRICT, WITHOUT ROWID;
				`;

				sqlite.exec({ sql: createTableSql });

				// Create basic indexes for the new table
				sqlite.exec({
					sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
				});
				sqlite.exec({
					sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_entity_id ON ${tableName} (entity_id)`,
				});

				// Run ANALYZE on the new table
				sqlite.exec({ sql: `ANALYZE ${tableName}` });

				// Clear table cache to force refresh
				tableCache.tables = null;

				// Perform the actual INSERT or UPDATE
				if (isInsert) {
					const insertSql = `
						INSERT INTO ${tableName} (
							entity_id, file_id, version_id, plugin_key, snapshot_content,
							schema_version, created_at, updated_at, inherited_from_version_id,
							inheritance_delete_marker, change_id, commit_id
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					`;

					// Retry logic for concurrent table creation race
					let retries = 3;
					while (retries > 0) {
						try {
							sqlite.exec({
								sql: insertSql,
								bind: [
									entity_id,
									file_id,
									version_id,
									plugin_key,
									snapshot_content,
									schema_version,
									created_at,
									updated_at,
									inherited_from_version_id,
									inheritance_delete_marker,
									change_id,
									commit_id,
								],
							});
							break;
						} catch (error: any) {
							if (error.message.includes("no such table") && retries > 1) {
								// Table creation race - retry
								sqlite.exec({ sql: createTableSql });
								retries--;
							} else {
								throw error;
							}
						}
					}
				} else {
					// UPDATE
					const updateSql = `
						UPDATE ${tableName} SET
							plugin_key = ?,
							snapshot_content = ?,
							schema_version = ?,
							created_at = ?,
							updated_at = ?,
							inherited_from_version_id = ?,
							inheritance_delete_marker = ?,
							change_id = ?,
							commit_id = ?
						WHERE entity_id = ? AND file_id = ? AND version_id = ?
					`;

					sqlite.exec({
						sql: updateSql,
						bind: [
							plugin_key,
							snapshot_content,
							schema_version,
							created_at,
							updated_at,
							inherited_from_version_id,
							inheritance_delete_marker,
							change_id,
							commit_id,
							entity_id,
							file_id,
							version_id,
						],
					});
				}

				return capi.SQLITE_OK;
			},
		},
		false
	);

	capi.sqlite3_create_module(sqlite.pointer!, "cache_v2_vtab", module, 0);

	// Create the virtual table
	sqlite.exec(
		`CREATE VIRTUAL TABLE IF NOT EXISTS internal_state_cache_v2 USING cache_v2_vtab();`
	);
}

// Helper function to get list of physical cache tables
function getPhysicalTables(
	sqlite: SqliteWasmDatabase,
	cache: { tables: string[] | null; timestamp: number; TTL: number }
): string[] {
	// Use cache if available and not expired
	if (cache.tables && Date.now() - cache.timestamp < cache.TTL) {
		return cache.tables;
	}

	const result = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema 
		      WHERE type='table' AND name LIKE 'internal_state_cache_%'
		      AND name != 'internal_state_cache'`,
		returnValue: "resultRows",
	});

	cache.tables = result ? result.map((row) => row[0] as string) : [];
	cache.timestamp = Date.now();
	return cache.tables;
}

// Helper function to load rows from next table
function loadNextTable(
	sqlite: SqliteWasmDatabase,
	cursorState: any,
	filters: Record<string, any>
): void {
	if (cursorState.currentTableIndex >= cursorState.tables.length) {
		return;
	}

	const tableName = cursorState.tables[cursorState.currentTableIndex];

	// Build query with filters (except schema_key which is implicit in table name)
	let sql = `SELECT * FROM ${tableName}`;
	const whereClauses: string[] = [];
	const bindParams: any[] = [];

	for (const [column, value] of Object.entries(filters)) {
		if (column !== "schema_key") {
			// Skip schema_key as it's implicit
			whereClauses.push(`${column} = ?`);
			bindParams.push(value);
		}
	}

	if (whereClauses.length > 0) {
		sql += ` WHERE ${whereClauses.join(" AND ")}`;
	}

	const result = sqlite.exec({
		sql,
		bind: bindParams,
		returnValue: "resultRows",
		rowMode: "object",
	});

	cursorState.currentRows = result || [];
}
