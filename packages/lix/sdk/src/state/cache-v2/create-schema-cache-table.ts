import type { LixEngine } from "../../engine/boot.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import {
	extractPropertySchema,
	mapSchemaPropertyToSqliteType,
} from "./sqlite-type-mapper.js";

/**
 * Creates (or updates) a per-schema internal state cache table with core indexes.
 * Idempotent: safe to call multiple times and on existing tables.
 *
 * Core choices:
 * - STRICT + WITHOUT ROWID for compact storage and fast PK lookups
 * - Metadata columns reuse the canonical state column names (`entity_id`, `version_id`, ...)
 * - Property columns are created using sanitized schema property names prefixed with `x_`
 * - Indexes continue to accelerate hot access patterns (version/file scans, tombstones)
 *
 * @example
 * createSchemaCacheTableV2({
 *   engine,
 *   schema,
 * });
 */
export function createSchemaCacheTableV2(args: {
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition | null | undefined;
}): void {
	const { engine, schema } = args;

	if (!schema) {
		throw new Error(
			"createSchemaCacheTableV2: schema definition is required for cache table creation."
		);
	}

	const schemaKey = getSchemaKey(schema);
	const schemaVersion = getSchemaVersion(schema);
	const tableName = schemaKeyToCacheTableNameV2(schemaKey, schemaVersion);

	const existingInfo = engine.executeSync({
		sql: `PRAGMA table_info(${tableName})`,
	}).rows as Array<{ name: string }> | undefined;

	if (existingInfo && existingInfo.length > 0) {
		const hasNormalizedColumns = existingInfo.some(
			(column) => column?.name === "entity_id"
		);
		if (!hasNormalizedColumns) {
			engine.executeSync({ sql: `DROP TABLE ${tableName}` });
		}
	}

	const propertyColumns = extractPropertyColumns(schema);
	const propertyColumnSql =
		propertyColumns.length > 0
			? `${propertyColumns
					.map(
						(column) =>
							`${column.column} ${mapSchemaPropertyToSqliteType(column.definition)}`
					)
					.join(",\n      ")},\n      `
			: "";

	const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      entity_id TEXT NOT NULL,
      schema_key TEXT NOT NULL,
      file_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      plugin_key TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      inherited_from_version_id TEXT,
      is_tombstone INTEGER DEFAULT 0,
      change_id TEXT,
      commit_id TEXT,
      ${propertyColumnSql}PRIMARY KEY (entity_id, file_id, version_id)
    ) STRICT, WITHOUT ROWID;
  `;

	engine.executeSync({ sql: createTableSql });

	// Core static indexes for common access patterns
	// 1) Fast version-scoped lookups (frequent)
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
	});

	// 2) Fast lookups by (version_id, file_id, entity_id) – complements PK order
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_vfe ON ${tableName} (version_id, file_id, entity_id)`,
	});

	// 3) Fast scans by file within a version
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_fv ON ${tableName} (file_id, version_id)`,
	});

	// 4) Partial index for live rows only to skip tombstones when applying predicates
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_live_vfe
			ON ${tableName} (version_id, file_id, entity_id)
			WHERE is_tombstone = 0`,
	});

	// 5) Partial index for tombstones when they are queried explicitly
	engine.executeSync({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_tomb_vfe
			ON ${tableName} (version_id, file_id, entity_id)
			WHERE is_tombstone = 1`,
	});

	// Update planner stats
	engine.executeSync({ sql: `ANALYZE ${tableName}` });
}

/**
 * Utility to sanitize a schema_key for use in a physical cache table name.
 *
 * @example
 * const tableName = schemaKeyToCacheTableNameV2("lix.commit", "1.0");
 */
export function schemaKeyToCacheTableNameV2(
	schema_key: string,
	schema_version: string
): string {
	const sanitizedKey = sanitizeIdentifier(schema_key);
	const versionSuffix = formatSchemaVersion(schema_version);
	return `lix_internal_state_cache_v2_${sanitizedKey}_${versionSuffix}`;
}

type PropertyColumn = {
	column: string;
	definition: Record<string, unknown> | undefined;
};

function extractPropertyColumns(
	schema: LixSchemaDefinition | null | undefined
): PropertyColumn[] {
	if (!schema || typeof schema !== "object") return [];
	const properties = schema.properties;
	if (!properties || typeof properties !== "object") {
		return [];
	}
	const columns: PropertyColumn[] = [];
	for (const key of Object.keys(properties)) {
		columns.push({
			column: propertyNameToColumn(key),
			definition: extractPropertySchema(schema, key),
		});
	}
	return columns;
}

export function propertyNameToColumn(property: string): string {
	const base = sanitizeIdentifier(property);
	const normalized = /^[0-9]/.test(base) ? `_${base}` : base;
	return `x_${normalized}`;
}

export function sanitizeIdentifier(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9]/g, "_");
	return sanitized.length === 0 ? "value" : sanitized;
}

/**
 * Returns schema property column names in insertion order.
 *
 * @example
 * const columns = getSchemaPropertyColumnNames(schema);
 */
export function getSchemaPropertyColumnNames(
	schema: LixSchemaDefinition | null | undefined
): string[] {
	return extractPropertyColumns(schema).map((column) => column.column);
}

/**
 * Resolves the x-lix-version string from a schema.
 *
 * @example
 * const version = getSchemaVersion(schema); // "1.0"
 */
export function getSchemaVersion(
	schema: LixSchemaDefinition | null | undefined
): string {
	const rawVersion = (schema as Record<string, unknown> | null | undefined)?.[
		"x-lix-version"
	];
	if (typeof rawVersion === "string" && rawVersion.trim().length > 0) {
		return rawVersion;
	}
	throw new Error(
		"createSchemaCacheTableV2: schema version (x-lix-version) is required."
	);
}

export function getSchemaKey(
	schema: LixSchemaDefinition | null | undefined
): string {
	const rawKey = (schema as Record<string, unknown> | null | undefined)?.[
		"x-lix-key"
	];
	if (typeof rawKey === "string" && rawKey.trim().length > 0) {
		return rawKey;
	}
	throw new Error(
		"createSchemaCacheTableV2: schema key (x-lix-key) is required."
	);
}

function formatSchemaVersion(schemaVersion: string): string {
	const trimmed = schemaVersion.trim();
	const match = /^(\d+)\.(\d+)$/.exec(trimmed);
	if (match) {
		return `v${match[1]}_${match[2]}`;
	}
	const sanitized = sanitizeIdentifier(trimmed);
	return sanitized.startsWith("v") ? sanitized : `v${sanitized}`;
}
