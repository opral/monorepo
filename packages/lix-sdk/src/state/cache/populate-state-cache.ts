import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "../../lix/open-lix.js";
import { getStateCacheV2Tables } from "./schema.js";

export interface PopulateStateCacheV2Options {
	version_id?: string; // Optional - if not provided, all active versions are populated
	entity_id?: string; // Optional
	schema_key?: string; // Optional
	file_id?: string; // Optional
}

/**
 * Populates the state cache v2 from the materializer view.
 *
 * This function reads from the materialized state and writes to the per-schema
 * physical cache tables using updateStateCacheV2 for optimal performance.
 *
 * @param lix - The Lix instance with sqlite and db
 * @param options - Optional filters for selective population
 */
export function populateStateCache(
	lix: Pick<Lix, "sqlite" | "db">,
	options: PopulateStateCacheV2Options = {}
): void {
	const { sqlite } = lix;

	// Build WHERE clause based on options
	const whereConditions: string[] = [];
	const bindParams: any[] = [];

	if (options.version_id) {
		whereConditions.push("m.version_id = ?");
		bindParams.push(options.version_id);
	} else {
		// If no version_id specified, only populate active versions (with tips)
		whereConditions.push(`EXISTS (
			SELECT 1 FROM internal_materialization_version_tips vt
			WHERE vt.version_id = m.version_id
		)`);
	}

	if (options.entity_id) {
		whereConditions.push("m.entity_id = ?");
		bindParams.push(options.entity_id);
	}
	if (options.schema_key) {
		whereConditions.push("m.schema_key = ?");
		bindParams.push(options.schema_key);
	}
	if (options.file_id) {
		whereConditions.push("m.file_id = ?");
		bindParams.push(options.file_id);
	}

	// Clear existing cache entries for v2 tables that match the criteria
	const tableCache = getStateCacheV2Tables(lix);

	if (options.schema_key) {
		// If schema_key is specified, only clear that specific table
		// Sanitize schema_key for table name - must match update-state-cache.ts
		const sanitizedSchemaKey = options.schema_key.replace(/[^a-zA-Z0-9]/g, "_");
		const tableName = `internal_state_cache_${sanitizedSchemaKey}`;
		if (tableCache.has(tableName)) {
			const deleteConditions: string[] = [];
			const deleteParams: any[] = [];

			if (options.version_id) {
				deleteConditions.push("version_id = ?");
				deleteParams.push(options.version_id);
			}
			if (options.entity_id) {
				deleteConditions.push("entity_id = ?");
				deleteParams.push(options.entity_id);
			}
			if (options.file_id) {
				deleteConditions.push("file_id = ?");
				deleteParams.push(options.file_id);
			}

			if (deleteConditions.length > 0) {
				sqlite.exec({
					sql: `DELETE FROM ${tableName} WHERE ${deleteConditions.join(" AND ")}`,
					bind: deleteParams,
				});
			} else {
				// Clear entire table for this schema
				sqlite.exec(`DELETE FROM ${tableName}`);
			}
		}
	} else {
		// Clear all v2 cache tables based on filters
		for (const tableName of tableCache) {
			// Skip the virtual table itself
			if (tableName === "internal_state_cache_v2") continue;

			const deleteConditions: string[] = [];
			const deleteParams: any[] = [];

			if (options.version_id) {
				deleteConditions.push("version_id = ?");
				deleteParams.push(options.version_id);
			}
			if (options.entity_id) {
				deleteConditions.push("entity_id = ?");
				deleteParams.push(options.entity_id);
			}
			if (options.file_id) {
				deleteConditions.push("file_id = ?");
				deleteParams.push(options.file_id);
			}

			if (deleteConditions.length > 0) {
				// Check if table exists before deleting
				const tableExists = sqlite.exec({
					sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
					bind: [tableName],
					returnValue: "resultRows",
				});

				if (tableExists && tableExists.length > 0) {
					sqlite.exec({
						sql: `DELETE FROM ${tableName} WHERE ${deleteConditions.join(" AND ")}`,
						bind: deleteParams,
					});
				}
			} else if (
				!options.version_id &&
				!options.entity_id &&
				!options.file_id
			) {
				// Only clear entire tables if no filters specified
				const tableExists = sqlite.exec({
					sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
					bind: [tableName],
					returnValue: "resultRows",
				});

				if (tableExists && tableExists.length > 0) {
					sqlite.exec(`DELETE FROM ${tableName}`);
				}
			}
		}
	}

	// Query materialized state to get changes
	const selectSql = `
		SELECT 
			m.entity_id,
			m.schema_key,
			m.file_id,
			m.version_id,
			m.plugin_key,
			m.snapshot_content,
			m.schema_version,
			m.created_at,
			m.updated_at,
			m.change_id,
			m.commit_id
		FROM internal_state_materializer m
		WHERE ${whereConditions.length > 0 ? whereConditions.join(" AND ") : "1=1"}
		  AND m.inherited_from_version_id IS NULL  -- Only direct entries, no inherited state
	`;

	const results = sqlite.exec({
		sql: selectSql,
		bind: bindParams,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	if (!results || results.length === 0) {
		return;
	}

	// Group results by schema_key for batch processing
	const rowsBySchema = new Map<string, any[]>();

	for (const row of results) {
		if (!rowsBySchema.has(row.schema_key)) {
			rowsBySchema.set(row.schema_key, []);
		}
		rowsBySchema.get(row.schema_key)!.push(row);
	}

	// Process each schema's rows directly to its physical table
	for (const [schema_key, schemaRows] of rowsBySchema) {
		// Sanitize schema_key for use in table name - must match update-state-cache.ts
		const sanitizedSchemaKey = schema_key.replace(/[^a-zA-Z0-9]/g, "_");
		const tableName = `internal_state_cache_${sanitizedSchemaKey}`;

		// Ensure table exists (creates if needed, updates cache)
		ensureTableExists(sqlite, tableName);

		// Batch insert with prepared statement
		const stmt = sqlite.prepare(`
			INSERT INTO ${tableName} (
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
				inheritance_delete_marker,
				change_id,
				commit_id
			) VALUES (?, ?, ?, ?, ?, jsonb(?), ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(entity_id, file_id, version_id) DO UPDATE SET
				schema_key = excluded.schema_key,
				plugin_key = excluded.plugin_key,
				snapshot_content = excluded.snapshot_content,
				schema_version = excluded.schema_version,
				-- Preserve both timestamps exactly as they are from the materializer
				created_at = excluded.created_at,
				updated_at = excluded.updated_at,
				inherited_from_version_id = excluded.inherited_from_version_id,
				inheritance_delete_marker = excluded.inheritance_delete_marker,
				change_id = excluded.change_id,
				commit_id = excluded.commit_id
		`);

		try {
			for (const row of schemaRows) {
				stmt.bind([
					row.entity_id,
					row.schema_key,
					row.file_id,
					row.version_id,
					row.plugin_key,
					row.snapshot_content, // jsonb() conversion happens in SQL
					row.schema_version,
					row.created_at, // Preserve original created_at
					row.updated_at, // Preserve original updated_at
					null, // inherited_from_version_id
					0, // inheritance_delete_marker
					row.change_id,
					row.commit_id,
				]);
				stmt.step();
				stmt.reset();
			}
		} finally {
			stmt.finalize();
		}
	}
}

/**
 * Ensures a table exists and updates the cache.
 * Duplicated from update-state-cache.ts to avoid circular dependency.
 */
function ensureTableExists(
	sqlite: SqliteWasmDatabase,
	tableName: string
): void {
	// Get cache for this sqlite instance
	const tableCache = getStateCacheV2Tables({ sqlite } as any);

	// Check cache first for performance
	if (tableCache.has(tableName)) {
		return;
	}

	// Create table if it doesn't exist
	const createTableSql = `
		CREATE TABLE IF NOT EXISTS ${tableName} (
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
			commit_id TEXT,
			PRIMARY KEY (entity_id, file_id, version_id)
		) STRICT, WITHOUT ROWID;
	`;

	sqlite.exec({ sql: createTableSql });

	// Create index on version_id for version-based queries
	sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
	});

	// Initial ANALYZE for new tables
	sqlite.exec({ sql: `ANALYZE ${tableName}` });

	// Update cache
	tableCache.add(tableName);
}
