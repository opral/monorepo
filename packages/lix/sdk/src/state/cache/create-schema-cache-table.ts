import type { LixEngine } from "../../engine/boot.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { buildSchemaIndexStatements } from "./schema-indexes.js";

/**
 * Creates (or updates) a per-schema internal state cache table with core indexes.
 * Idempotent: safe to call multiple times and on existing tables.
 *
 * Core choices:
 * - STRICT + WITHOUT ROWID for compact storage and fast PK lookups
 * - PK(entity_id, file_id, version_id) to reflect logical identity
 * - Indexes to accelerate common access patterns used by views/benches
 * - Partial indexes for live/tombstone scans so SQLite can skip dead rows quickly
 */
/**
 * Ensures a schema-specific cache table exists and returns its physical name.
 *
 * The table contains a strict layout that mirrors materialized state rows and
 * creates core indexes optimised for read-heavy cache workloads. The function is
 * idempotent — callers may invoke it multiple times without side effects.
 *
 * @example
 *
 * ```ts
 * const tableName = createSchemaCacheTable({
 *   engine,
 *   schema: definition,
 * });
 * console.log(tableName); // "lix_internal_state_cache_v1_example"
 * ```
 */
export function createSchemaCacheTable(args: {
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
}): string {
	const { engine, schema } = args;
	const schemaKey = schema["x-lix-key"];
	if (typeof schemaKey !== "string" || schemaKey.length === 0) {
		throw new Error(
			"createSchemaCacheTable: schema must include a non-empty x-lix-key."
		);
	}

	const tableName = schemaKeyToCacheTableName(schemaKey);

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
      is_tombstone INTEGER DEFAULT 0,
      change_id TEXT,
      commit_id TEXT,
      PRIMARY KEY (entity_id, file_id, version_id)
    ) STRICT, WITHOUT ROWID;
  `;

	engine.executeSync({ sql: createTableSql, preprocessMode: "none" });

	// Core static indexes for common access patterns
	// 1) Fast version-scoped lookups (frequent)
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
		preprocessMode: "none",
	});

	// 2) Fast lookups by (version_id, file_id, entity_id) – complements PK order
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_vfe ON ${tableName} (version_id, file_id, entity_id)`,
		preprocessMode: "none",
	});

	// 2b) Fast lookups when queries omit file_id (entity+version filters)
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_ve ON ${tableName} (version_id, entity_id)`,
		preprocessMode: "none",
	});

	// 3) Fast scans by file within a version
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_fv ON ${tableName} (file_id, version_id)`,
		preprocessMode: "none",
	});

	// 4) Partial index for live rows only to skip tombstones when applying predicates
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_live_vfe
			ON ${tableName} (version_id, file_id, entity_id)
			WHERE is_tombstone = 0 AND snapshot_content IS NOT NULL`,
		preprocessMode: "none",
	});

	// 5) Partial index for tombstones when they are queried explicitly
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_tomb_vfe
			ON ${tableName} (version_id, file_id, entity_id)
			WHERE is_tombstone = 1 AND snapshot_content IS NULL`,
		preprocessMode: "none",
	});

	// Extra expression indexes for descriptor cache
	if (tableName === "lix_internal_state_cache_v1_lix_version_descriptor") {
		// Speed up recursive inheritance walks by indexing the parent pointer extracted from JSON
		engine.executeSync({
			sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_inherits_from
		        ON ${tableName}(json_extract(snapshot_content, '$.inherits_from_version_id'))
		        WHERE json_extract(snapshot_content, '$.inherits_from_version_id') IS NOT NULL`,
			preprocessMode: "none",
		});
		// Pair child/parent ids to avoid temp b-trees when deduping inheritance edges
		engine.executeSync({
			sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_id_parent
		        ON ${tableName}(json_extract(snapshot_content, '$.id'), json_extract(snapshot_content, '$.inherits_from_version_id'))`,
			preprocessMode: "none",
		});
	}

	// Update planner stats
	engine.executeSync({ sql: `ANALYZE ${tableName}`, preprocessMode: "none" });

	const indexStatements = buildSchemaIndexStatements({
		schema,
		tableName,
	});

	const traceEnv = (globalThis as any)?.process?.env;
	const traceIndexesFlag =
		typeof traceEnv?.LIX_TRACE_SCHEMA_INDEXES === "string" &&
		traceEnv.LIX_TRACE_SCHEMA_INDEXES.toLowerCase() !== "false" &&
		traceEnv.LIX_TRACE_SCHEMA_INDEXES !== "0";
	for (const statement of indexStatements) {
		if (traceIndexesFlag) {
			console.debug(
				`createSchemaCacheTable index -> ${statement.name}: ${statement.sql}`
			);
		}
		engine.executeSync({ sql: statement.sql, preprocessMode: "none" });
	}

	return tableName;
}

/** Utility to sanitize a schema_key for use in a physical table name */
export function schemaKeyToCacheTableName(schema_key: string): string {
	const sanitized = schema_key.replace(/[^a-zA-Z0-9]/g, "_");
	return `lix_internal_state_cache_v1_${sanitized}`;
}

const CACHE_TABLE_PREFIX = "lix_internal_state_cache_v1_";

export function cacheTableNameToSchemaKey(tableName: string): string {
	if (tableName.startsWith(CACHE_TABLE_PREFIX)) {
		return tableName.slice(CACHE_TABLE_PREFIX.length);
	}
	return tableName;
}
