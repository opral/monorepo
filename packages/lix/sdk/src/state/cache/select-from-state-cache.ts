import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableName } from "./create-schema-cache-table.js";

const BASE_COLUMNS = [
	"_pk",
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
	"inheritance_delete_marker",
	"change_id",
	"commit_id",
] as const;

const ALIAS_COLUMNS: Record<string, string> = {
	entity_id: "lixcol_entity_id",
	schema_key: "lixcol_schema_key",
	file_id: "lixcol_file_id",
	version_id: "lixcol_version_id",
	plugin_key: "lixcol_plugin_key",
	snapshot_content: "lixcol_snapshot_content",
	schema_version: "lixcol_schema_version",
	created_at: "lixcol_created_at",
	updated_at: "lixcol_updated_at",
	inherited_from_version_id: "lixcol_inherited_from_version_id",
	inheritance_delete_marker: "lixcol_inheritance_delete_marker",
	change_id: "lixcol_change_id",
	commit_id: "lixcol_commit_id",
};

const ROUTED_ALIAS = "internal_state_cache_routed";
const STATE_PK_EXPRESSION =
	"entity_id || '|' || schema_key || '|' || file_id || '|' || version_id";

const ALL_COLUMNS: string[] = [
	...BASE_COLUMNS,
	...Object.values(ALIAS_COLUMNS),
] as const;

type StateCacheColumn = (typeof ALL_COLUMNS)[number];

export type StateCacheRow = Record<StateCacheColumn, unknown>;

/**
 * Returns a Kysely query builder routed to the materialized table for the
 * provided schema key. Pass `undefined` to opt into a no-op SELECT (useful when
 * the physical table might not exist yet).
 */
export function selectFromStateCache(
	schemaKey?: string
): SelectQueryBuilder<any, string, StateCacheRow> {
	const selectSql = schemaKey
		? buildSelectStatement(schemaKeyToCacheTableName(schemaKey))
		: buildEmptySelect();

	const tableExpression = sql<StateCacheRow>`(${sql.raw(selectSql)})`.as(
		ROUTED_ALIAS
	);

	return internalQueryBuilder.selectFrom(
		tableExpression
	) as unknown as SelectQueryBuilder<any, string, StateCacheRow>;
}

function buildSelectStatement(tableName: string): string {
	const quoted = quoteIdentifier(tableName);
	const aliasExpressions = Object.entries(ALIAS_COLUMNS)
		.map(([column, alias]) => `${column} AS ${quoteIdentifier(alias)}`)
		.join(",\n\t");

	return `SELECT
	${STATE_PK_EXPRESSION} AS _pk,
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
	commit_id,
	${aliasExpressions}
FROM ${quoted}`;
}

function buildEmptySelect(): string {
	const baseProjection = BASE_COLUMNS.map(
		(column) => `CAST(NULL AS TEXT) AS ${quoteIdentifier(column)}`
	);
	const aliasProjection = Object.values(ALIAS_COLUMNS).map(
		(alias) => `CAST(NULL AS TEXT) AS ${quoteIdentifier(alias)}`
	);
	return `SELECT
	${[...baseProjection, ...aliasProjection].join(",\n\t")}
WHERE 0`;
}

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}
