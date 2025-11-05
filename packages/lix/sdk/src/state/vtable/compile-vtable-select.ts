import { schemaKeyToCacheTableName } from "../cache/create-schema-cache-table.js";
import {
	CACHE_COLUMNS,
	type StateCacheColumn,
} from "../cache/select-from-state-cache.js";

const VERSION_DESCRIPTOR_SCHEMA_KEY = "lix_version_descriptor";
const NEWLINE = "\n";

const VTABLE_COLUMNS = [
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
	"change_id",
	"untracked",
	"commit_id",
	"metadata",
	"writer_key",
] as const;

const VTABLE_COLUMN_SET = new Set<string>(VTABLE_COLUMNS);

type VtableColumn = (typeof VTABLE_COLUMNS)[number];
type SegmentColumn = VtableColumn | "priority";

const ALL_SEGMENT_COLUMNS: readonly SegmentColumn[] = [
	"_pk",
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"version_id",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"metadata",
	"writer_key",
	"priority",
];

const BASE_SEGMENT_COLUMNS = new Set<SegmentColumn>([
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"created_at",
	"change_id",
	"priority",
]);

export type InlineVtableSqlOptions = {
	filteredSchemaKeys?: readonly string[] | null;
	requiredColumns?: readonly string[] | null;
	hasOpenTransaction?: boolean;
};

/**
 * Compiles inline SQL that mirrors the resolved state vtable.
 *
 * @example
 * ```ts
 * const sql = compileVtableSelectSql({ filteredSchemaKeys: ["test_schema"] });
 * ```
 */
export function compileVtableSelectSql(
	options: InlineVtableSqlOptions
): string {
	const schemaKeys = normalizeSchemaKeys(options.filteredSchemaKeys);
	const columns = normalizeColumns(options.requiredColumns);
	const includeTransactions = options.hasOpenTransaction !== false;

	const projectionConfig = buildProjectionConfig(columns);
	const schemaFilter = buildSchemaFilter(schemaKeys);
	const cacheColumns = buildCacheColumns(
		projectionConfig.candidateColumns,
		includeTransactions
	);
	const cacheSource = buildCacheSource(schemaKeys, cacheColumns);

	const segments: string[] = [];
	if (includeTransactions) {
		segments.push(
			buildTransactionSegment(schemaFilter, projectionConfig.candidateColumns)
		);
	}
	segments.push(
		buildUntrackedSegment(schemaFilter, projectionConfig.candidateColumns)
	);

	const cacheSegment = buildCacheSegment(
		cacheSource,
		schemaFilter,
		projectionConfig.candidateColumns
	);
	if (cacheSegment) {
		segments.push(cacheSegment);

		const inheritedCacheSegment = buildInheritedCacheSegment(
			cacheSource,
			schemaFilter,
			projectionConfig.candidateColumns
		);
		if (inheritedCacheSegment) {
			segments.push(inheritedCacheSegment);
		}
	}

	segments.push(
		buildInheritedUntrackedSegment(
			schemaFilter,
			projectionConfig.candidateColumns
		)
	);

	if (includeTransactions) {
		segments.push(
			buildInheritedTransactionSegment(
				schemaFilter,
				projectionConfig.candidateColumns
			)
		);
	}

	const candidatesSql = segments.join(
		`${NEWLINE}${NEWLINE}    UNION ALL${NEWLINE}${NEWLINE}`
	);
	const rankingOrder = [
		"c.priority",
		"c.created_at DESC",
		"c.file_id",
		"c.schema_key",
		"c.entity_id",
		"c.version_id",
		"c.change_id",
	];
	const rankedSql = buildRankedSegment(
		projectionConfig.rankedColumns,
		rankingOrder
	);

	const withClauses = [
		buildVersionDescriptorCte(),
		buildVersionInheritanceCte(),
		buildVersionParentCte(),
		stripIndent(`
	candidates AS (
${indent(candidatesSql, 4)}
	)`),
		stripIndent(`
	ranked AS (
${indent(rankedSql, 4)}
	)`),
	];

	const projectionSql = buildProjectionSql(columns, {
		needsWriterJoin: projectionConfig.needsWriterJoin,
		needsChangeJoin: projectionConfig.needsChangeJoin,
		includeTransactions,
	});

	const writerJoinSql = projectionConfig.needsWriterJoin
		? `\n${stripIndent(`
LEFT JOIN lix_internal_state_writer ws_dst ON
  ws_dst.file_id = w.file_id AND
  ws_dst.entity_id = w.entity_id AND
  ws_dst.schema_key = w.schema_key AND
  ws_dst.version_id = w.version_id
LEFT JOIN lix_internal_state_writer ws_src ON
  ws_src.file_id = w.file_id AND
  ws_src.entity_id = w.entity_id AND
  ws_src.schema_key = w.schema_key AND
  ws_src.version_id = COALESCE(w.inherited_from_version_id, w.version_id)`)}`
		: "";

	const changeJoinSql = projectionConfig.needsChangeJoin
		? `\n${stripIndent(`
LEFT JOIN lix_internal_change ch ON ch.id = w.change_id`)}`
		: "";

	const transactionJoinSql =
		projectionConfig.needsChangeJoin && includeTransactions
			? `\n${stripIndent(`
LEFT JOIN lix_internal_transaction_state itx ON itx.id = w.change_id`)}`
			: "";

	return stripIndent(`
WITH RECURSIVE
${indent(withClauses.join(`,${NEWLINE}`), 2)}
SELECT
${indent(projectionSql, 2)}
FROM ranked w${writerJoinSql}${changeJoinSql}${transactionJoinSql}
WHERE w.rn = 1`);
}

function normalizeSchemaKeys(schemaKeys?: readonly string[] | null): string[] {
	if (!schemaKeys || schemaKeys.length === 0) {
		return [];
	}
	const seen = new Set<string>();
	const result: string[] = [];
	for (const schemaKey of schemaKeys) {
		if (!schemaKey || schemaKey === VERSION_DESCRIPTOR_SCHEMA_KEY) {
			continue;
		}
		if (seen.has(schemaKey)) {
			continue;
		}
		seen.add(schemaKey);
		result.push(schemaKey);
	}
	return result;
}

function normalizeColumns(
	requiredColumns?: readonly string[] | null
): readonly VtableColumn[] {
	if (!requiredColumns || requiredColumns.length === 0) {
		return VTABLE_COLUMNS;
	}

	const selected = new Set<VtableColumn>();
	for (const column of requiredColumns) {
		if (VTABLE_COLUMN_SET.has(column)) {
			selected.add(column as VtableColumn);
		}
	}

	if (selected.size === 0) {
		return VTABLE_COLUMNS;
	}

	return VTABLE_COLUMNS.filter((column) => selected.has(column));
}

function buildProjectionConfig(columns: readonly VtableColumn[]): {
	candidateColumns: Set<SegmentColumn>;
	rankedColumns: Set<SegmentColumn>;
	needsWriterJoin: boolean;
	needsChangeJoin: boolean;
} {
	const candidateColumns = new Set<SegmentColumn>(BASE_SEGMENT_COLUMNS);
	const rankedColumns = new Set<SegmentColumn>(BASE_SEGMENT_COLUMNS);

	for (const column of columns) {
		candidateColumns.add(column);
		rankedColumns.add(column);
	}

	const needsWriterJoin = candidateColumns.has("writer_key");
	if (needsWriterJoin) {
		candidateColumns.add("inherited_from_version_id");
		rankedColumns.add("inherited_from_version_id");
	}

	const needsChangeJoin = candidateColumns.has("metadata");

	candidateColumns.add("snapshot_content");
	rankedColumns.add("snapshot_content");

	return {
		candidateColumns,
		rankedColumns,
		needsWriterJoin,
		needsChangeJoin,
	};
}

function buildProjectionSql(
	columns: readonly VtableColumn[],
	options: {
		needsWriterJoin: boolean;
		needsChangeJoin: boolean;
		includeTransactions: boolean;
	}
): string {
	return columns
		.map((column) => buildProjectionExpression(column, options))
		.join(`,${NEWLINE}`);
}

function buildProjectionExpression(
	column: VtableColumn,
	options: {
		needsWriterJoin: boolean;
		needsChangeJoin: boolean;
		includeTransactions: boolean;
	}
): string {
	if (column === "metadata") {
		if (!options.needsChangeJoin) {
			return "w.metadata AS metadata";
		}
		const sources = ["w.metadata", "json(ch.metadata)"];
		if (options.includeTransactions) {
			sources.push("json(itx.metadata)");
		}
		return `COALESCE(${sources.join(", ")}) AS metadata`;
	}
	if (column === "writer_key") {
		if (!options.needsWriterJoin) {
			return "w.writer_key AS writer_key";
		}
		return "COALESCE(ws_dst.writer_key, ws_src.writer_key, w.writer_key) AS writer_key";
	}
	return `w.${column} AS ${column}`;
}

function buildSchemaFilter(schemaKeys: readonly string[]): string | null {
	if (!schemaKeys || schemaKeys.length === 0) {
		return null;
	}
	const values = schemaKeys
		.map((key) => `'${key.replace(/'/g, "''")}'`)
		.join(", ");
	return `txn.schema_key IN (${values})`;
}

function buildCacheSource(
	schemaKeys: readonly string[],
	cacheColumns: readonly StateCacheColumn[]
): string | null {
	if (!schemaKeys || schemaKeys.length === 0) {
		return null;
	}
	const uniqueKeys = Array.from(new Set(schemaKeys));
	if (uniqueKeys.length === 1) {
		return quoteIdentifier(schemaKeyToCacheTableName(uniqueKeys[0]!));
	}
	const statements = uniqueKeys.map((schemaKey) =>
		compileCacheSelectStatement(schemaKey, cacheColumns)
	);
	return statements.join(`${NEWLINE}UNION ALL${NEWLINE}`);
}

function compileCacheSelectStatement(
	schemaKey: string,
	columns: readonly StateCacheColumn[]
): string {
	const tableName = quoteIdentifier(schemaKeyToCacheTableName(schemaKey));
	const projection = columns.map(quoteIdentifier).join(`,${NEWLINE}    `);
	return `SELECT
    ${projection}
  FROM ${tableName}`;
}

function buildTransactionSegment(
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string {
	const filterClause = schemaFilter ? `WHERE ${schemaFilter}` : "";
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk`,
		],
		["entity_id", "txn.entity_id AS entity_id"],
		["schema_key", "txn.schema_key AS schema_key"],
		["file_id", "txn.file_id AS file_id"],
		["plugin_key", "txn.plugin_key AS plugin_key"],
		["snapshot_content", "json(txn.snapshot_content) AS snapshot_content"],
		["schema_version", "txn.schema_version AS schema_version"],
		["version_id", "txn.version_id AS version_id"],
		["created_at", "txn.created_at AS created_at"],
		["updated_at", "txn.created_at AS updated_at"],
		["inherited_from_version_id", "NULL AS inherited_from_version_id"],
		["change_id", "txn.id AS change_id"],
		["untracked", "txn.untracked AS untracked"],
		["commit_id", "'pending' AS commit_id"],
		["metadata", "json(txn.metadata) AS metadata"],
		["writer_key", "txn.writer_key AS writer_key"],
		["priority", "1 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM lix_internal_transaction_state txn
		${filterClause}
	`);
}

function buildUntrackedSegment(
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string {
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "unt.")
		: null;
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'U' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(unt.version_id) AS _pk`,
		],
		["entity_id", "unt.entity_id AS entity_id"],
		["schema_key", "unt.schema_key AS schema_key"],
		["file_id", "unt.file_id AS file_id"],
		["plugin_key", "unt.plugin_key AS plugin_key"],
		["snapshot_content", "json(unt.snapshot_content) AS snapshot_content"],
		["schema_version", "unt.schema_version AS schema_version"],
		["version_id", "unt.version_id AS version_id"],
		["created_at", "unt.created_at AS created_at"],
		["updated_at", "unt.updated_at AS updated_at"],
		["inherited_from_version_id", "NULL AS inherited_from_version_id"],
		["change_id", "'untracked' AS change_id"],
		["untracked", "1 AS untracked"],
		["commit_id", "'untracked' AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "2 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	const whereClause = rewrittenFilter ? `WHERE ${rewrittenFilter}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM lix_internal_state_all_untracked unt
		${whereClause}
	`);
}

function buildCacheSegment(
	cacheSource: string | null,
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string | null {
	if (!cacheSource) {
		return null;
	}
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "cache.")
		: null;
	const sourceKeyword = cacheSource.trim().toLowerCase();
	const sourceSql = sourceKeyword.startsWith("select")
		? `(${cacheSource})`
		: cacheSource;
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'C' || '~' || lix_encode_pk_part(cache.file_id) || '~' || lix_encode_pk_part(cache.entity_id) || '~' || lix_encode_pk_part(cache.version_id) AS _pk`,
		],
		["entity_id", "cache.entity_id AS entity_id"],
		["schema_key", "cache.schema_key AS schema_key"],
		["file_id", "cache.file_id AS file_id"],
		["plugin_key", "cache.plugin_key AS plugin_key"],
		["snapshot_content", "json(cache.snapshot_content) AS snapshot_content"],
		["schema_version", "cache.schema_version AS schema_version"],
		["version_id", "cache.version_id AS version_id"],
		["created_at", "cache.created_at AS created_at"],
		["updated_at", "cache.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"cache.inherited_from_version_id AS inherited_from_version_id",
		],
		["change_id", "cache.change_id AS change_id"],
		["untracked", "0 AS untracked"],
		["commit_id", "cache.commit_id AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "3 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	const tombstoneFilter = `
		(
			(cache.is_tombstone = 0 AND cache.snapshot_content IS NOT NULL) OR
			(cache.is_tombstone = 1 AND cache.snapshot_content IS NULL)
		)`.trim();
	const filterClause = [
		tombstoneFilter,
		rewrittenFilter ? rewrittenFilter : null,
	]
		.filter((value): value is string => Boolean(value))
		.map((value) => (value.startsWith("(") ? value : `(${value})`))
		.join(" AND ");
	const whereClause = filterClause ? `WHERE ${filterClause}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM ${sourceSql} cache
		${whereClause}
	`);
}

function buildInheritedCacheSegment(
	cacheSource: string | null,
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string | null {
	if (!cacheSource) {
		return null;
	}
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "cache.")
		: null;
	const sourceKeyword = cacheSource.trim().toLowerCase();
	const sourceSql = sourceKeyword.startsWith("select")
		? `(${cacheSource})`
		: cacheSource;
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'CI' || '~' || lix_encode_pk_part(cache.file_id) || '~' || lix_encode_pk_part(cache.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "cache.entity_id AS entity_id"],
		["schema_key", "cache.schema_key AS schema_key"],
		["file_id", "cache.file_id AS file_id"],
		["plugin_key", "cache.plugin_key AS plugin_key"],
		["snapshot_content", "json(cache.snapshot_content) AS snapshot_content"],
		["schema_version", "cache.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "cache.created_at AS created_at"],
		["updated_at", "cache.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"cache.version_id AS inherited_from_version_id",
		],
		["change_id", "cache.change_id AS change_id"],
		["untracked", "0 AS untracked"],
		["commit_id", "cache.commit_id AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "4 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	const filterClause = rewrittenFilter ? ` AND ${rewrittenFilter}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_inheritance vi
		JOIN ${sourceSql} cache ON cache.version_id = vi.ancestor_version_id
		WHERE cache.is_tombstone = 0
		  AND cache.snapshot_content IS NOT NULL${filterClause}
	`);
}

function buildInheritedUntrackedSegment(
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string {
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "unt.")
		: null;
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "unt.entity_id AS entity_id"],
		["schema_key", "unt.schema_key AS schema_key"],
		["file_id", "unt.file_id AS file_id"],
		["plugin_key", "unt.plugin_key AS plugin_key"],
		["snapshot_content", "json(unt.snapshot_content) AS snapshot_content"],
		["schema_version", "unt.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "unt.created_at AS created_at"],
		["updated_at", "unt.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"unt.version_id AS inherited_from_version_id",
		],
		["change_id", "'untracked' AS change_id"],
		["untracked", "1 AS untracked"],
		["commit_id", "'untracked' AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "5 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	const filterClause = rewrittenFilter ? ` AND ${rewrittenFilter}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_inheritance vi
		JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
		WHERE unt.is_tombstone = 0
		  AND unt.snapshot_content IS NOT NULL${filterClause}
	`);
}

function buildInheritedTransactionSegment(
	schemaFilter: string | null,
	projectionColumns: Set<SegmentColumn>
): string {
	const columns: Array<[SegmentColumn, string]> = [
		[
			"_pk",
			`'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "txn.entity_id AS entity_id"],
		["schema_key", "txn.schema_key AS schema_key"],
		["file_id", "txn.file_id AS file_id"],
		["plugin_key", "txn.plugin_key AS plugin_key"],
		["snapshot_content", "json(txn.snapshot_content) AS snapshot_content"],
		["schema_version", "txn.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "txn.created_at AS created_at"],
		["updated_at", "txn.created_at AS updated_at"],
		[
			"inherited_from_version_id",
			"vi.parent_version_id AS inherited_from_version_id",
		],
		["change_id", "txn.id AS change_id"],
		["untracked", "txn.untracked AS untracked"],
		["commit_id", "'pending' AS commit_id"],
		["metadata", "json(txn.metadata) AS metadata"],
		["writer_key", "txn.writer_key AS writer_key"],
		["priority", "6 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(`,${NEWLINE}`);
	const rewrittenFilter = schemaFilter ?? null;
	const filterClause = rewrittenFilter ? ` AND ${rewrittenFilter}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_parent vi
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL${filterClause}
	`);
}

function buildRankedSegment(
	projectionColumns: Set<SegmentColumn>,
	rankingOrder: string[]
): string {
	const columns = ALL_SEGMENT_COLUMNS.filter((column) =>
		projectionColumns.has(column)
	).map((column) => `c.${column} AS ${column}`);
	const orderClause = rankingOrder.join(", ");
	const projectionLines =
		columns.length > 0 ? `${columns.join(`,${NEWLINE}`)},${NEWLINE}` : "";
	return stripIndent(`
		SELECT
${indent(projectionLines, 4)}  ROW_NUMBER() OVER (
		    PARTITION BY c.file_id, c.schema_key, c.entity_id, c.version_id
		    ORDER BY ${orderClause}
		  ) AS rn
		FROM candidates c
	`);
}

const VTABLE_TO_CACHE_COLUMN: Partial<Record<VtableColumn, StateCacheColumn>> =
	{
		entity_id: "entity_id",
		schema_key: "schema_key",
		file_id: "file_id",
		version_id: "version_id",
		plugin_key: "plugin_key",
		snapshot_content: "snapshot_content",
		schema_version: "schema_version",
		created_at: "created_at",
		updated_at: "updated_at",
		inherited_from_version_id: "inherited_from_version_id",
		change_id: "change_id",
		commit_id: "commit_id",
	};

function buildCacheColumns(
	columns: Set<SegmentColumn>,
	includeTransactions: boolean
): readonly StateCacheColumn[] {
	const required = new Set<StateCacheColumn>([
		"entity_id",
		"schema_key",
		"file_id",
		"version_id",
		"snapshot_content",
		"inherited_from_version_id",
		"is_tombstone",
		"change_id",
		"commit_id",
		"created_at",
		"updated_at",
	]);

	if (includeTransactions) {
		required.add("schema_version");
	}

	for (const column of columns) {
		if (column !== "priority") {
			const cacheColumn = VTABLE_TO_CACHE_COLUMN[column as VtableColumn];
			if (cacheColumn) {
				required.add(cacheColumn);
			}
		}
	}

	return CACHE_COLUMNS.filter((column) => required.has(column));
}

function buildVersionDescriptorCte(): string {
	return stripIndent(`
	version_descriptor_base AS (
	  SELECT
	    json_extract(desc.snapshot_content, '$.id') AS version_id,
	    json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
	  FROM "lix_internal_state_cache_v1_lix_version_descriptor" desc
	  WHERE desc.is_tombstone = 0
	    AND desc.snapshot_content IS NOT NULL
	)`);
}

function buildVersionInheritanceCte(): string {
	return stripIndent(`
	version_inheritance(version_id, ancestor_version_id) AS (
	  SELECT
	    vdb.version_id,
	    vdb.inherits_from_version_id
	  FROM version_descriptor_base vdb
	  WHERE vdb.inherits_from_version_id IS NOT NULL

	  UNION ALL

	  SELECT
	    vi.version_id,
	    vdb.inherits_from_version_id
	  FROM version_inheritance vi
	  JOIN version_descriptor_base vdb ON vdb.version_id = vi.ancestor_version_id
	  WHERE vdb.inherits_from_version_id IS NOT NULL
	)`);
}

function buildVersionParentCte(): string {
	return stripIndent(`
	version_parent AS (
	  SELECT
	    vdb.version_id,
	    vdb.inherits_from_version_id AS parent_version_id
	  FROM version_descriptor_base vdb
	  WHERE vdb.inherits_from_version_id IS NOT NULL
	)`);
}

function stripIndent(value: string): string {
	const trimmed = value.replace(/^\n+/, "").replace(/\n+$/, "");
	const lines = trimmed.split(NEWLINE);
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^\s*/)?.[0]?.length ?? 0);
	const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((line) => line.slice(minIndent)).join(NEWLINE);
}

function indent(value: string, spaces: number): string {
	const pad = " ".repeat(spaces);
	return value
		.split(NEWLINE)
		.map((line) => (line.length > 0 ? pad + line : line))
		.join(NEWLINE);
}

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}
