import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";
import { CACHE_COLUMNS } from "./cache-columns.js";
import {
	getStateCacheSchemaProperties,
	type CacheSchemaPropertyMetadata,
} from "./schema-metadata.js";

const ROUTED_ALIAS = "lix_internal_state_cache_routed";

const SNAPSHOT_COLUMN = "snapshot_content" as const;

type MaterializedCacheColumn =
	| (typeof CACHE_COLUMNS)[number]
	| "inheritance_delete_marker";

const MATERIALIZED_CACHE_COLUMNS: MaterializedCacheColumn[] = [];
for (const column of CACHE_COLUMNS) {
	MATERIALIZED_CACHE_COLUMNS.push(column);
}
MATERIALIZED_CACHE_COLUMNS.push("inheritance_delete_marker");

const COLUMN_TO_PHYSICAL: Record<MaterializedCacheColumn, string> = {
	entity_id: "entity_id",
	schema_key: "schema_key",
	file_id: "file_id",
	version_id: "version_id",
	plugin_key: "plugin_key",
	schema_version: "schema_version",
	created_at: "created_at",
	updated_at: "updated_at",
	inherited_from_version_id: "inherited_from_version_id",
	change_id: "change_id",
	commit_id: "commit_id",
	is_tombstone: "is_tombstone",
	inheritance_delete_marker: "is_tombstone",
} as const;

type VirtualColumn = typeof SNAPSHOT_COLUMN;

const VIRTUAL_COLUMN_NAMES: readonly VirtualColumn[] = [SNAPSHOT_COLUMN];

type StateCacheColumn = MaterializedCacheColumn | VirtualColumn;

const SELECTABLE_COLUMNS: StateCacheColumn[] = [];
for (const column of MATERIALIZED_CACHE_COLUMNS) {
	SELECTABLE_COLUMNS.push(column);
}
for (const column of VIRTUAL_COLUMN_NAMES) {
	SELECTABLE_COLUMNS.push(column);
}

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
	const projection = SELECTABLE_COLUMNS.map((column: StateCacheColumn) =>
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
	const projection = SELECTABLE_COLUMNS.map((column: StateCacheColumn) =>
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
			COLUMN_TO_PHYSICAL[column as keyof typeof COLUMN_TO_PHYSICAL];
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
	const tombstoneColumn = quoteIdentifier("is_tombstone");
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
