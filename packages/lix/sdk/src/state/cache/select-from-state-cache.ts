import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableName } from "./create-schema-cache-table.js";

export const CACHE_COLUMNS = [
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
	"is_tombstone",
	"change_id",
	"commit_id",
] as const;

const ROUTED_ALIAS = "lix_internal_state_cache_routed";

type StateCacheColumn = (typeof CACHE_COLUMNS)[number];

export type StateCacheRow = Record<StateCacheColumn, unknown>;

/**
 * Returns a Kysely query builder routed to the materialized table for the
 * provided schema key. Pass `undefined` to opt into a no-op SELECT (useful when
 * the physical table might not exist yet).
 */
export function selectFromStateCache(
	schemaKey?: string,
	columns: readonly StateCacheColumn[] = CACHE_COLUMNS
): SelectQueryBuilder<any, string, StateCacheRow> {
	const selectSql = schemaKey
		? buildSelectStatement(schemaKeyToCacheTableName(schemaKey), columns)
		: buildEmptySelect(columns);

	const tableExpression = sql<StateCacheRow>`(${sql.raw(selectSql)})`.as(
		ROUTED_ALIAS
	);

	return internalQueryBuilder.selectFrom(
		tableExpression
	) as unknown as SelectQueryBuilder<any, string, StateCacheRow>;
}

function buildSelectStatement(
	tableName: string,
	columns: readonly StateCacheColumn[]
): string {
	const quoted = quoteIdentifier(tableName);
	const projection = columns.map(quoteIdentifier).join(",\n\t");
	return `SELECT
	${projection}
FROM ${quoted}`;
}

function buildEmptySelect(columns: readonly StateCacheColumn[]): string {
	const projection = columns
		.map((column) => `CAST(NULL AS TEXT) AS ${quoteIdentifier(column)}`)
		.join(",\n\t");
	return `SELECT
	${projection}
WHERE 0`;
}

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}
