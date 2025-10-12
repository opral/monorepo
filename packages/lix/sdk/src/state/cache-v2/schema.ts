import type { LixEngine } from "../../engine/boot.js";
import type { SqliteWasmDatabase } from "../../database/sqlite/index.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStoredSchema } from "../../stored-schema/get-stored-schema.js";
import {
	createSchemaCacheTableV2,
	getSchemaVersion,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";

export type InternalStateCache = InternalStateCacheTable;

// Type definition for the cache v2 virtual table
export type InternalStateCacheTable = {
	lixcol_entity_id: string;
	lixcol_schema_key: string;
	lixcol_file_id: string;
	lixcol_version_id: string;
	lixcol_plugin_key: string;
	lixcol_schema_version: string;
	lixcol_created_at: string;
	lixcol_updated_at: string;
	lixcol_inherited_from_version_id: string | null;
	lixcol_is_tombstone: number; // 0 or 1
	lixcol_change_id: string | null;
	lixcol_commit_id: string | null;
	[property: string]: unknown;
};
// Virtual table schema definition - matches existing lix_internal_state_cache structure
const CACHE_VTAB_CREATE_SQL = `CREATE TABLE x(
	_pk HIDDEN TEXT NOT NULL PRIMARY KEY,
		lixcol_entity_id TEXT NOT NULL,
		lixcol_schema_key TEXT NOT NULL,
		lixcol_file_id TEXT NOT NULL,
		lixcol_version_id TEXT NOT NULL,
		lixcol_plugin_key TEXT NOT NULL,
		lixcol_schema_version TEXT NOT NULL,
		lixcol_created_at TEXT NOT NULL,
		lixcol_updated_at TEXT NOT NULL,
		lixcol_inherited_from_version_id TEXT,
		lixcol_is_tombstone INTEGER DEFAULT 0,
		lixcol_change_id TEXT,
		lixcol_commit_id TEXT
) WITHOUT ROWID;`;

// Cache of physical tables scoped to each Lix instance
// Using WeakMap ensures proper cleanup when Lix instances are garbage collected
const stateCacheV2TablesMap = new WeakMap<object, Set<string>>();
const stateCacheV2ColumnsMap = new WeakMap<object, Map<string, Set<string>>>();

/**
 * Returns the memoized set of cache tables for a Lix engine instance.
 *
 * @example
 * const tables = getStateCacheV2Tables({ engine: lix.engine! });
 */
export function getStateCacheV2Tables(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Set<string> {
	let cache = stateCacheV2TablesMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Set<string>();
		stateCacheV2TablesMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

function getColumnCacheMap(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Map<string, Set<string>> {
	let map = stateCacheV2ColumnsMap.get(args.engine.runtimeCacheRef);
	if (!map) {
		map = new Map<string, Set<string>>();
		stateCacheV2ColumnsMap.set(args.engine.runtimeCacheRef, map);
	}
	return map;
}

function fetchTableColumns(args: {
	engine: Pick<LixEngine, "executeSync">;
	tableName: string;
}): Set<string> {
	const result = args.engine.executeSync({
		sql: `PRAGMA table_info(${args.tableName})`,
	});
	const rows = Array.isArray(result?.rows) ? result.rows : [];
	const columns = new Set<string>();
	for (const row of rows as any[]) {
		if (row && typeof row.name === "string") {
			columns.add(row.name);
		}
	}
	return columns;
}

export function getStateCacheV2Columns(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">;
	tableName: string;
}): Set<string> {
	const cacheMap = getColumnCacheMap({ engine: args.engine });
	let columns = cacheMap.get(args.tableName);
	if (!columns) {
		columns = fetchTableColumns({
			engine: args.engine,
			tableName: args.tableName,
		});
		cacheMap.set(args.tableName, columns);
	}
	return columns;
}

export function registerStateCacheV2Column(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">;
	tableName: string;
	columnName: string;
}): void {
	const columns = getStateCacheV2Columns({
		engine: args.engine,
		tableName: args.tableName,
	});
	columns.add(args.columnName);
}

export function clearStateCacheV2Columns(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">;
	tableName: string;
}): void {
	const cacheMap = getColumnCacheMap({ engine: args.engine });
	cacheMap.delete(args.tableName);
}

/**
 * Installs the cache v2 virtual table and ensures bootstrap tables exist.
 *
 * @example
 * applyStateCacheV2Schema({ engine: lix.engine! });
 */
export function applyStateCacheV2Schema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "executeSync" | "runtimeCacheRef" | "hooks"
	>;
}): void {
	const { sqlite } = args.engine;

	// Get or create cache for this Lix instance
	const tableCache = getStateCacheV2Tables({ engine: args.engine });

	// Initialize cache with existing tables on startup
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_%'`,
		returnValue: "resultRows",
	}) as any[];

	if (existingTables) {
		for (const row of existingTables) {
			tableCache.add(row[0] as string);
		}
	}

	// Ensure descriptor cache table exists for inheritance rewrites
	const descriptorSchema = requireSchemaDefinition({
		engine: args.engine,
		schemaKey: "lix_version_descriptor",
	});
	const descriptorVersion = getSchemaVersion(descriptorSchema);
	const descriptorTable = schemaKeyToCacheTableNameV2(
		"lix_version_descriptor",
		descriptorVersion
	);
	if (!tableCache.has(descriptorTable)) {
		createSchemaCacheTableV2({
			engine: args.engine,
			schema: descriptorSchema,
			tableName: descriptorTable,
		});
		tableCache.add(descriptorTable);
	}

	// Note: INSERT/UPDATE/DELETE operations are now handled by updateStateCacheV2()
	// which writes directly to physical tables for better performance.
	// This vtable is now read-only.

	// Create virtual table using the proper SQLite WASM API
	const capi = sqlite.sqlite3.capi;
	const module = new capi.sqlite3_module();

	// Store cursor states - maps cursor pointer to state
	const cursorStates = new Map();

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
					"lixcol_entity_id",
					"lixcol_schema_key",
					"lixcol_file_id",
					"lixcol_version_id",
					"lixcol_plugin_key",
					"lixcol_schema_version",
					"lixcol_created_at",
					"lixcol_updated_at",
					"lixcol_inherited_from_version_id",
					"lixcol_is_tombstone",
					"lixcol_change_id",
					"lixcol_commit_id",
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
							const usage = idxInfo.nthConstraintUsage(i);
							usage.$argvIndex = ++argIndex;
							if (columnName === "lixcol_schema_key") {
								// schema key determines which physical cache table we read from, so
								// once the planner hands us this constraint we can omit re-applying
								// it at SQL level. Preventing SQLite from emitting `WHERE lixcol_schema_key = ?`
								// makes it clear that each cache table already holds rows for exactly
								// one schema.
								usage.$omit = 1;
							}
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

					// Lower cost when we can use filters (especially lixcol_schema_key)
					// Schema key is the most selective since it determines which table to query
					const hasSchemaKey = usableConstraints.includes("lixcol_schema_key");
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
					filters: {}, // Filters from xFilter to use in xNext
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
				// throw new Error("Read should happen via lix_internal_state_vtable");
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

				// Store filters in cursor state for use in xNext
				if (
					filters.schema_key !== undefined &&
					filters.lixcol_schema_key === undefined
				) {
					filters.lixcol_schema_key = filters.schema_key;
				}
				cursorState.filters = filters;

				// Determine which tables to query
				if (filters.lixcol_schema_key) {
					const schemaKeyValue = String(filters.lixcol_schema_key);
					const versionFilter =
						typeof filters.lixcol_schema_version === "string"
							? filters.lixcol_schema_version
							: undefined;

					if (versionFilter) {
						const tableName = schemaKeyToCacheTableNameV2(
							schemaKeyValue,
							versionFilter
						);
						const tableExists = sqlite.exec({
							sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
							bind: [tableName],
							returnValue: "resultRows",
						});

						if (tableExists && tableExists.length > 0) {
							cursorState.tables = [tableName];
							tableCache.add(tableName);
						} else {
							cursorState.tables = [];
						}
					} else {
						cursorState.tables = getTablesForSchemaKey(
							sqlite,
							tableCache,
							schemaKeyValue
						);
					}
				} else {
					// No schema key filter - need to query all cache tables
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

				// Load first non-empty table if available
				if (cursorState.tables.length > 0) {
					loadNextTable(sqlite, cursorState, filters);
					// Skip empty tables at the start
					while (
						cursorState.currentRows.length === 0 &&
						cursorState.currentTableIndex < cursorState.tables.length - 1
					) {
						cursorState.currentTableIndex++;
						cursorState.currentRowIndex = 0;
						loadNextTable(sqlite, cursorState, filters);
					}
				}

				return capi.SQLITE_OK;
			},

			xNext: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				cursorState.currentRowIndex++;

				// Check if we need to move to next table
				while (
					cursorState.currentRowIndex >= cursorState.currentRows.length &&
					cursorState.currentTableIndex < cursorState.tables.length
				) {
					// Move to next table
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
						// Use the stored filters from xFilter
						loadNextTable(sqlite, cursorState, cursorState.filters || {});
						// If the table we just loaded is also empty, continue loop
					}
				}

				return capi.SQLITE_OK;
			},

			xEof: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				// Check if we've run out of tables entirely
				if (cursorState.currentTableIndex >= cursorState.tables.length) {
					return 1;
				}
				// Check if we're past the end of the current table's rows
				// This handles both empty tables and exhausted tables
				if (cursorState.currentRowIndex >= cursorState.currentRows.length) {
					// If this is the last table and we're out of rows, we're at EOF
					if (cursorState.currentTableIndex === cursorState.tables.length - 1) {
						return 1;
					}
					// Otherwise, there might be more tables, so not EOF yet
					// xNext will handle moving to the next table
					return 0;
				}
				return 0;
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
					case 0: {
						// _pk - composite primary key (needs schema_key for DELETE)
						value = `${row.lixcol_entity_id}|${row.lixcol_schema_key}|${row.lixcol_file_id}|${row.lixcol_version_id}`;
						break;
					}
					case 1:
						value = row.lixcol_entity_id;
						break;
					case 2: // schema_key - read from row
						value = row.lixcol_schema_key;
						break;
					case 3:
						value = row.lixcol_file_id;
						break;
					case 4:
						value = row.lixcol_version_id;
						break;
					case 5:
						value = row.lixcol_plugin_key;
						break;
					case 6:
						value = row.lixcol_schema_version;
						break;
					case 7:
						value = row.lixcol_created_at;
						break;
					case 8:
						value = row.lixcol_updated_at;
						break;
					case 9:
						value = row.lixcol_inherited_from_version_id;
						break;
					case 10:
						value = row.lixcol_is_tombstone;
						break;
					case 11:
						value = row.lixcol_change_id;
						break;
					case 12:
						value = row.lixcol_commit_id;
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

			xUpdate: () => {
				// All write operations should use updateStateCacheV2()
				return capi.SQLITE_READONLY;
			},
		},
		false
	);

	capi.sqlite3_create_module(
		sqlite.pointer!,
		"lix_internal_state_cache_vtable",
		module,
		0
	);

	// Create the virtual table
	sqlite.exec(
		`CREATE VIRTUAL TABLE IF NOT EXISTS lix_internal_state_cache USING lix_internal_state_cache_vtable();`
	);
}

// Helper function to get list of physical cache tables
function getPhysicalTables(
	sqlite: SqliteWasmDatabase,
	cache: Set<string>
): string[] {
	// Always refresh cache from database since direct function may have created new tables
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_%'`,
		returnValue: "resultRows",
	}) as any[];

	if (existingTables) {
		for (const row of existingTables) {
			cache.add(row[0] as string);
		}
	}

	// Convert Set to array and filter out base tables
	return Array.from(cache).filter(
		(name) =>
			name !== "lix_internal_state_cache" && name !== "lix_internal_state_cache"
	);
}

function getTablesForSchemaKey(
	sqlite: SqliteWasmDatabase,
	cache: Set<string>,
	schemaKey: string
): string[] {
	const sanitizedKey = String(schemaKey).replace(/[^a-zA-Z0-9]/g, "_");
	const likePattern = `lix_internal_state_cache_${sanitizedKey}_v%`;
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE ?`,
		bind: [likePattern],
		returnValue: "resultRows",
	}) as any[];

	const tableNames = (existingTables ?? []).map((row) => row?.[0] as string);
	for (const name of tableNames) {
		if (typeof name === "string" && name.length > 0) {
			cache.add(name);
		}
	}
	return tableNames.filter(Boolean);
}

function requireSchemaDefinition(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schemaKey: string;
}): LixSchemaDefinition {
	const schema = getStoredSchema({ engine: args.engine, key: args.schemaKey });
	if (!schema) {
		throw new Error(
			`applyStateCacheV2Schema: stored schema not found for schema_key "${args.schemaKey}"`
		);
	}
	return schema;
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

	// Build query with filters (except schema key which is implicit in table name)
	let sql = `SELECT * FROM ${tableName}`;
	const whereClauses: string[] = [];
	const bindParams: any[] = [];

	// Don't filter tombstones here - let the view decide what to filter
	// This allows the resolved view to check for tombstones when needed

	for (const [column, value] of Object.entries(filters)) {
		if (
			column !== "schema_key" &&
			column !== "lixcol_schema_key" &&
			column !== "schema_version" &&
			column !== "lixcol_schema_version"
		) {
			// Skip schema key as it's implicit
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
