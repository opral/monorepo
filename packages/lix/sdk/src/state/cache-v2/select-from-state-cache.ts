import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";
import {
	getStateCacheSchemaProperties,
	type CacheSchemaPropertyMetadata,
} from "./schema-metadata.js";

const ROUTED_ALIAS = "lix_internal_state_cache_routed";

const SNAPSHOT_COLUMN = "snapshot_content" as const;

const LEGACY_CACHE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"schema_version",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"inheritance_delete_marker",
	"change_id",
	"commit_id",
] as const;

const LEGACY_COLUMN_TO_PHYSICAL: Record<
	(typeof LEGACY_CACHE_COLUMNS)[number],
	string
> = {
	entity_id: "lixcol_entity_id",
	schema_key: "lixcol_schema_key",
	file_id: "lixcol_file_id",
	version_id: "lixcol_version_id",
	plugin_key: "lixcol_plugin_key",
	schema_version: "lixcol_schema_version",
	created_at: "lixcol_created_at",
	updated_at: "lixcol_updated_at",
	inherited_from_version_id: "lixcol_inherited_from_version_id",
	inheritance_delete_marker: "lixcol_is_tombstone",
	change_id: "lixcol_change_id",
	commit_id: "lixcol_commit_id",
} as const;

const VIRTUAL_COLUMN_NAMES = [SNAPSHOT_COLUMN] as const;

const SELECTABLE_COLUMNS = [
	...LEGACY_CACHE_COLUMNS,
	...VIRTUAL_COLUMN_NAMES,
] as const;

type StateCacheColumn = (typeof SELECTABLE_COLUMNS)[number];

export type StateCacheRow = Record<StateCacheColumn, unknown>;

/**
 * Returns a Kysely query builder routed to the materialized table for the
 * provided schema key. Pass `undefined` to opt into a no-op SELECT (useful when
 * the physical table might not exist yet). Includes a `snapshot_content` virtual
 * column to maintain compatibility with cache v1 consumers.
 *
 * @example
 * const rows = await selectFromStateCacheV2("lix_commit", "1.0").execute();
 */
export function selectFromStateCacheV2(
	schemaKey?: string,
	schemaVersion?: string
): SelectQueryBuilder<any, string, StateCacheRow> {
	let selectSql: string;
	let propertyMetadata: CacheSchemaPropertyMetadata[] | undefined;

	if (schemaKey) {
		const version = requireSchemaVersion(schemaVersion);
		propertyMetadata = getStateCacheSchemaProperties({
			schemaKey,
			schemaVersion: version,
		});
		selectSql = buildSelectStatement(
			schemaKeyToCacheTableNameV2(schemaKey, version),
			propertyMetadata
		);
	} else {
		selectSql = buildEmptySelect();
	}

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

function buildSelectStatement(
	tableName: string,
	propertyMetadata?: CacheSchemaPropertyMetadata[]
): string {
	const quoted = quoteIdentifier(tableName);
	const projection = SELECTABLE_COLUMNS.map((column) =>
		formatProjection(column, {
			includeTableColumn: true,
			propertyMetadata: propertyMetadata ?? [],
		})
	).join(",\n\t");
	return `SELECT
	${projection}
FROM ${quoted}`;
}

function buildEmptySelect(): string {
	const projection = SELECTABLE_COLUMNS.map((column) =>
		formatProjection(column, {
			includeTableColumn: false,
			propertyMetadata: [],
		})
	).join(",\n\t");
	return `SELECT
	${projection}
WHERE 0`;
}

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

function formatProjection(
	column: StateCacheColumn,
	options: {
		includeTableColumn: boolean;
		propertyMetadata: CacheSchemaPropertyMetadata[];
	}
): string {
	const aliasIdentifier = quoteIdentifier(column);
	if (column === SNAPSHOT_COLUMN) {
		if (!options.includeTableColumn) {
			return `CAST(NULL AS TEXT) AS ${aliasIdentifier}`;
		}
		return `${buildSnapshotContentExpression(options.propertyMetadata)} AS ${aliasIdentifier}`;
	}
	if (options.includeTableColumn) {
		const physical =
			LEGACY_COLUMN_TO_PHYSICAL[column as keyof typeof LEGACY_COLUMN_TO_PHYSICAL];
		if (physical) {
			const physicalIdentifier = quoteIdentifier(physical);
			if (physical === column) {
				return physicalIdentifier;
			}
			return `${physicalIdentifier} AS ${aliasIdentifier}`;
		}
		return aliasIdentifier;
	}
	return `CAST(NULL AS TEXT) AS ${aliasIdentifier}`;
}

function buildSnapshotContentExpression(
	properties: CacheSchemaPropertyMetadata[]
): string {
	const tombstoneColumn = quoteIdentifier("lixcol_is_tombstone");
	const jsonExpression = properties.length
		? `json_object(${properties
				.map((property) => buildSnapshotPropertyPair(property))
				.join(", ")})`
		: "json('{}')";
	return `CASE WHEN ${tombstoneColumn} = 1 THEN NULL ELSE ${jsonExpression} END`;
}

function buildSnapshotPropertyPair(
	property: CacheSchemaPropertyMetadata
): string {
	const keyLiteral = `'${escapeSingleQuotes(property.propertyName)}'`;
	const valueExpression = buildSnapshotPropertyValue(property);
	return `${keyLiteral}, ${valueExpression}`;
}

function buildSnapshotPropertyValue(
	property: CacheSchemaPropertyMetadata
): string {
	const column = quoteIdentifier(property.columnName);
	switch (property.valueKind) {
		case "boolean":
			return `CASE WHEN ${column} IS NULL THEN NULL WHEN ${column} = 1 THEN json('true') WHEN ${column} = 0 THEN json('false') ELSE NULL END`;
		case "json":
			return `CASE WHEN ${column} IS NULL THEN NULL ELSE json(${column}) END`;
		case "number":
		case "integer":
			return column;
		case "string":
		default:
			return `CASE WHEN ${column} IS NULL THEN NULL ELSE json_quote(${column}) END`;
	}
}

function escapeSingleQuotes(value: string): string {
	return value.replace(/'/g, "''");
}
