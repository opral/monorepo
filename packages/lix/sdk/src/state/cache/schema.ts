import type { LixEngine } from "../../engine/boot.js";
import type { SqliteWasmDatabase } from "../../database/sqlite/index.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "./create-schema-cache-table.js";
import { selectFromStateCacheV2 } from "../cache-v2/select-from-state-cache.js";
import {
	getStateCacheV2Columns,
	getStateCacheV2TableMetadata,
} from "../cache-v2/schema.js";

export type InternalStateCache = InternalStateCacheTable;

// Type definition for the cache v2 virtual table
export type InternalStateCacheTable = {
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
// Virtual table schema definition - matches existing lix_internal_state_cache structure
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

const LEGACY_TO_PHYSICAL_COLUMNS: Record<string, string> = {
	entity_id: "lixcol_entity_id",
	schema_key: "lixcol_schema_key",
	file_id: "lixcol_file_id",
	version_id: "lixcol_version_id",
	plugin_key: "lixcol_plugin_key",
	snapshot_content: "snapshot_content",
	schema_version: "lixcol_schema_version",
	created_at: "lixcol_created_at",
	updated_at: "lixcol_updated_at",
	inherited_from_version_id: "lixcol_inherited_from_version_id",
	inheritance_delete_marker: "lixcol_is_tombstone",
	change_id: "lixcol_change_id",
	commit_id: "lixcol_commit_id",
};

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

// Cache of physical tables scoped to each Lix instance
// Using WeakMap ensures proper cleanup when Lix instances are garbage collected
const stateCacheV2TablesMap = new WeakMap<object, Set<string>>();

// Export a getter function to access the cache for a specific Lix instance
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

export function applyStateCacheV2Schema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeSync" | "runtimeCacheRef">;
}): void {
	const { sqlite } = args.engine;

	// Get or create cache for this Lix instance
	const tableCache = getStateCacheV2Tables({ engine: args.engine });

	// Initialize cache with existing tables on startup
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v1_%'`,
		returnValue: "resultRows",
	}) as any[];

	if (existingTables) {
		for (const row of existingTables) {
			tableCache.add(row[0] as string);
		}
	}

	// Ensure descriptor cache table exists for inheritance rewrites
	const descriptorTable = schemaKeyToCacheTableName("lix_version_descriptor");
	if (!tableCache.has(descriptorTable)) {
		createSchemaCacheTable({
			engine: args.engine,
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
							const usage = idxInfo.nthConstraintUsage(i);
							usage.$argvIndex = ++argIndex;
							if (columnName === "schema_key") {
								// schema_key determines which physical cache table we read from, so
								// once the planner hands us this constraint we can omit re-applying
								// it at SQL level. Preventing SQLite from emitting `WHERE schema_key = ?`
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
				cursorState.filters = filters;

				// Determine which tables to query
				if (filters.schema_key) {
					// Single schema_key - query single table
					// Sanitize schema_key for table name - must match update-state-cache.ts
					const sanitizedSchemaKey = String(filters.schema_key).replace(
						/[^a-zA-Z0-9]/g,
						"_"
					);
					const matchingTables = sqlite.exec({
						sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE ?`,
						bind: [`lix_internal_state_cache_v1_${sanitizedSchemaKey}%`],
						returnValue: "resultRows",
					}) as Array<[string]> | undefined;

					cursorState.tables = matchingTables
						? matchingTables.map((row) => row[0] as string).sort()
						: [];
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

				// Load first non-empty table if available
				if (cursorState.tables.length > 0) {
					loadNextTable(sqlite, cursorState, filters, args.engine);
					// Skip empty tables at the start
					while (
						cursorState.currentRows.length === 0 &&
						cursorState.currentTableIndex < cursorState.tables.length - 1
					) {
						cursorState.currentTableIndex++;
						cursorState.currentRowIndex = 0;
						loadNextTable(sqlite, cursorState, filters, args.engine);
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
						loadNextTable(
							sqlite,
							cursorState,
							cursorState.filters || {},
							args.engine
						);
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
						value = `${row.entity_id}|${row.schema_key}|${row.file_id}|${row.version_id}`;
						break;
					}
					case 1:
						value = row.entity_id;
						break;
					case 2: // schema_key - read from row
						value = row.schema_key;
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
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v1_%'`,
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

// Helper function to load rows from next table
function loadNextTable(
	sqlite: SqliteWasmDatabase,
	cursorState: any,
	filters: Record<string, any>,
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">
): void {
	if (cursorState.currentTableIndex >= cursorState.tables.length) {
		return;
	}

	const tableName = cursorState.tables[cursorState.currentTableIndex];

	const columnNames = getStateCacheV2Columns({
		engine,
		tableName,
	});

	const tableMetadata = getStateCacheV2TableMetadata({
		engine,
		tableName,
	});

	if (
		tableMetadata &&
		columnNames.has("lixcol_entity_id") &&
		columnNames.has("lixcol_schema_key")
	) {
		let builder = selectFromStateCacheV2(
			tableMetadata.schemaKey,
			tableMetadata.schemaVersion
		).selectAll();

		for (const [column, value] of Object.entries(filters)) {
			if (column === "schema_key") continue;
			builder = builder.where(column as any, "=", value);
		}

		const compiled = builder.compile();
		const result = sqlite.exec({
			sql: compiled.sql,
			bind: compiled.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
		});
		cursorState.currentRows = result || [];
		return;
	}

	const aliasExpressions: string[] = [];
	for (const [legacy, physical] of Object.entries(LEGACY_TO_PHYSICAL_COLUMNS)) {
		if (legacy === "snapshot_content") {
			continue;
		}
		const physicalColumn = columnNames.has(physical)
			? physical
			: columnNames.has(legacy)
				? legacy
				: null;
		if (physicalColumn && physicalColumn !== legacy) {
			aliasExpressions.push(
				`t.${quoteIdentifier(physicalColumn)} AS ${quoteIdentifier(legacy)}`
			);
		}
	}
	const aliasSql =
		aliasExpressions.length > 0 ? `, ${aliasExpressions.join(", ")}` : "";

	let sql = `SELECT t.*${aliasSql} FROM ${tableName} AS t`;
	const whereClauses: string[] = [];
	const bindParams: any[] = [];

	for (const [column, value] of Object.entries(filters)) {
		if (column !== "schema_key") {
			const physicalColumn = resolvePhysicalColumn(columnNames, column);
			whereClauses.push(`t.${quoteIdentifier(physicalColumn)} = ?`);
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

function resolvePhysicalColumn(
	columnNames: Set<string>,
	column: string
): string {
	if (columnNames.has(column)) {
		return column;
	}
	const mapped = LEGACY_TO_PHYSICAL_COLUMNS[column];
	if (mapped && columnNames.has(mapped)) {
		return mapped;
	}
	return column;
}
