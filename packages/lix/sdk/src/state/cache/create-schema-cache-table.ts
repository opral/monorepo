import type { LixRuntime } from "../../runtime/boot.js";

/**
 * Creates (or updates) a per-schema internal state cache table with core indexes.
 * Idempotent: safe to call multiple times and on existing tables.
 *
 * Core choices:
 * - STRICT + WITHOUT ROWID for compact storage and fast PK lookups
 * - PK(entity_id, file_id, version_id) to reflect logical identity
 * - Indexes to accelerate common access patterns used by views/benches
 */
export function createSchemaCacheTable(args: {
	runtime: Pick<LixRuntime, "sqlite">;
	tableName: string;
}): void {
	const { runtime, tableName } = args;

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

	runtime.sqlite.exec({ sql: createTableSql });

	// Core static indexes for common access patterns
	// 1) Fast version-scoped lookups (frequent)
	runtime.sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
	});

	// 2) Fast lookups by (version_id, file_id, entity_id) – complements PK order
	runtime.sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_vfe ON ${tableName} (version_id, file_id, entity_id)`,
	});

	// 3) Fast scans by file within a version
	runtime.sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_fv ON ${tableName} (file_id, version_id)`,
	});

	// Update planner stats
	runtime.sqlite.exec({ sql: `ANALYZE ${tableName}` });
}

/** Utility to sanitize a schema_key for use in a physical table name */
export function schemaKeyToCacheTableName(schema_key: string): string {
	const sanitized = schema_key.replace(/[^a-zA-Z0-9]/g, "_");
	return `internal_state_cache_${sanitized}`;
}
