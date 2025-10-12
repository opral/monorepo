import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";

const CACHE_COLUMNS = [
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
] as const;

const ROUTED_ALIAS = "lix_internal_state_cache_routed";

type StateCacheColumn = (typeof CACHE_COLUMNS)[number];

export type StateCacheRow = Record<StateCacheColumn, unknown>;

/**
 * Returns a Kysely query builder routed to the materialized table for the
 * provided schema key. Pass `undefined` to opt into a no-op SELECT (useful when
 * the physical table might not exist yet).
 *
 * @example
 * const rows = await selectFromStateCacheV2("lix_commit", "1.0").execute();
 */
export function selectFromStateCacheV2(
	schemaKey?: string,
	schemaVersion?: string
): SelectQueryBuilder<any, string, StateCacheRow> {
	const selectSql = schemaKey
		? buildSelectStatement(
				schemaKeyToCacheTableNameV2(
					schemaKey,
					requireSchemaVersion(schemaVersion)
				)
			)
		: buildEmptySelect();

	const tableExpression = sql<StateCacheRow>`(${sql.raw(selectSql)})`.as(
		ROUTED_ALIAS
	);

	return internalQueryBuilder.selectFrom(
		tableExpression
	) as unknown as SelectQueryBuilder<any, string, StateCacheRow>;
}

function requireSchemaVersion(schemaVersion: string | undefined): string {
	if (typeof schemaVersion === "string" && schemaVersion.trim().length > 0) {
		return schemaVersion;
	}
	throw new Error(
		"selectFromStateCacheV2: schemaVersion is required when schemaKey is provided."
	);
}

function buildSelectStatement(tableName: string): string {
	const quoted = quoteIdentifier(tableName);
	const projection = CACHE_COLUMNS.map(quoteIdentifier).join(",\n\t");
	return `SELECT
	${projection}
FROM ${quoted}`;
}

function buildEmptySelect(): string {
	const projection = CACHE_COLUMNS.map(
		(column) => `CAST(NULL AS TEXT) AS ${quoteIdentifier(column)}`
	).join(",\n\t");
	return `SELECT
	${projection}
WHERE 0`;
}

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}
