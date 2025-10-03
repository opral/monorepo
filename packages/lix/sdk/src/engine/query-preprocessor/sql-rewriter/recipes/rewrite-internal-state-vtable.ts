import type { Shape } from "../microparser/analyze-shape.js";

type TransactionOption = {
	includeTransaction?: boolean;
};

export function buildHoistedInternalStateVtableCte(
	shapes: Shape[],
	options?: TransactionOption
): string | null {
	if (shapes.length === 0) {
		return null;
	}

	const includeTransaction = options?.includeTransaction !== false;

	const schemaKeys = new Set<string>();
	for (const shape of shapes) {
		for (const entry of shape.schemaKeys) {
			if (entry.kind === "literal") {
				schemaKeys.add(entry.value);
			}
		}
	}

	const canonicalQuery = buildInternalStateVtableQuery({
		shapes,
		schemaKeys: [...schemaKeys],
		includeTransaction,
	});
	const cteBody = stripIndent(`
		-- hoisted_internal_state_vtable_rewrite
		internal_state_vtable_rewritten AS (
${indent(canonicalQuery, 4)}
		)
	`);

	return cteBody.trim();
}

export function buildInternalStateVtableProjection(
	shape: Shape
): string | null {
	if (shape.referencesPrimaryKey) {
		return null;
	}

	const projection = VISIBLE_STATE_COLUMNS.join(", ");
	const aliasSql = shape.table.aliasSql ?? shape.table.alias;
	return `(SELECT ${projection} FROM internal_state_vtable_rewritten) AS ${aliasSql}`;
}

/**
 * Build a replacement subquery for `internal_state_vtable`.
 * Returns `null` when the query shape is outside the supported surface.
 */
export function rewriteInternalStateVtableQuery(
	shape: Shape,
	options?: TransactionOption
): string | null {
	const schemaKey = pickSingleLiteral(shape.schemaKeys);

	const includePrimaryKey = shape.referencesPrimaryKey;
	const includeTransaction = options?.includeTransaction !== false;

	const canonicalQuery = buildInternalStateVtableQuery({
		shapes: [shape],
		schemaKeys: schemaKey ? [schemaKey] : [],
		includeTransaction,
	});
	return maybeStripHiddenPrimaryKey(canonicalQuery, includePrimaryKey);
}

interface InternalStateVtableQueryOptions {
	shapes: Shape[];
	schemaKeys: string[];
	includeTransaction: boolean;
}

interface VersionCteResult {
	sql: string;
	paramsAvailable: boolean;
}

const CACHE_SOURCE_TOKEN = "__CACHE_SOURCE__";

function buildInternalStateVtableQuery(
	options: InternalStateVtableQueryOptions
): string {
	const cacheSource = options.schemaKeys.length
		? `(${buildCacheRoutingSql(options.schemaKeys)})`
		: "internal_state_cache";

	const versionCtes = buildVersionCtes(options.shapes);
	const schemaFilter = collectColumnFilter(options.shapes, "schema_key");
	const entityFilter = collectColumnFilter(options.shapes, "entity_id");
	const candidatesBody = buildCandidatesBody({
		includeTransaction: options.includeTransaction,
		paramsAvailable: versionCtes.paramsAvailable,
		schemaFilter,
		entityFilter,
	});
	const rankedBody = buildRankedBody();
	const finalSelect = stripIndent(`
SELECT
  r._pk,
  r.entity_id,
  r.schema_key,
  r.file_id,
  r.plugin_key,
  r.snapshot_content,
  r.schema_version,
  r.version_id,
  r.created_at,
  r.updated_at,
  r.inherited_from_version_id,
  r.change_id,
  r.untracked,
  r.commit_id,
  COALESCE(r.metadata, ch.metadata) AS metadata,
  COALESCE(ws_dst.writer_key, ws_src.writer_key) AS writer_key
FROM ranked r
LEFT JOIN internal_state_writer ws_dst ON
  ws_dst.file_id = r.file_id AND
  ws_dst.entity_id = r.entity_id AND
  ws_dst.schema_key = r.schema_key AND
  ws_dst.version_id = r.version_id
LEFT JOIN internal_state_writer ws_src ON
  ws_src.file_id = r.file_id AND
  ws_src.entity_id = r.entity_id AND
  ws_src.schema_key = r.schema_key AND
  ws_src.version_id = COALESCE(r.inherited_from_version_id, r.version_id)
LEFT JOIN change ch ON ch.id = r.change_id
WHERE r.rn = 1
`);

	const sql =
		`${versionCtes.sql},
` +
		`  candidates AS (
${indent(candidatesBody, 4)}
  ),
` +
		`  ranked AS (
${indent(rankedBody, 4)}
  )
` +
		`${finalSelect}`;

	return sql.replaceAll(CACHE_SOURCE_TOKEN, cacheSource);
}

interface ColumnFilter {
	literals: string[];
	placeholder?: string;
}

interface CandidateSegmentOptions {
	paramsAvailable?: boolean;
	schemaFilter: ColumnFilter | null;
	entityFilter: ColumnFilter | null;
}

function buildCandidatesBody(options: {
	includeTransaction: boolean;
	paramsAvailable: boolean;
	schemaFilter: ColumnFilter | null;
	entityFilter: ColumnFilter | null;
}): string {
	const segments: string[] = [];
	if (options.includeTransaction) {
		segments.push(
			buildCandidateTransactionSegment({
				paramsAvailable: options.paramsAvailable,
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
			})
		);
	}
	segments.push(
		buildCandidateUntrackedSegment({
			paramsAvailable: options.paramsAvailable,
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
		}),
		buildCandidateCacheSegment({
			paramsAvailable: options.paramsAvailable,
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
		}),
		buildCandidateInheritedCacheSegment({
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
		}),
		buildCandidateInheritedUntrackedSegment({
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
		})
	);
	if (options.includeTransaction) {
		segments.push(
			buildCandidateInheritedTransactionSegment({
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
			})
		);
	}
	return segments.join("\n\nUNION ALL\n\n");
}

function buildRankedBody(): string {
	return stripIndent(`
	SELECT
	  c._pk,
	  c.entity_id,
	  c.schema_key,
	  c.file_id,
	  c.plugin_key,
	  c.snapshot_content,
	  c.schema_version,
	  c.dst_version_id AS version_id,
	  c.created_at,
	  c.updated_at,
	  c.inherited_from_version_id,
	  c.change_id,
	  c.untracked,
	  c.commit_id,
	  c.metadata,
	  c.priority,
	  ROW_NUMBER() OVER (
	    PARTITION BY c.file_id, c.schema_key, c.entity_id, c.dst_version_id
	    ORDER BY c.priority,
	             c.created_at DESC,
	             c._pk
	  ) AS rn
	FROM candidates c
	`);
}

function buildCandidateTransactionSegment(
	options: CandidateSegmentOptions
): string {
	return stripIndent(`
		SELECT
		  'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk,
		  txn.entity_id,
		  txn.schema_key,
		  txn.file_id,
		  txn.plugin_key,
		  json(txn.snapshot_content) AS snapshot_content,
		  txn.schema_version,
		  txn.version_id AS src_version_id,
		  txn.version_id AS dst_version_id,
		  txn.created_at,
		  txn.created_at AS updated_at,
		  NULL AS inherited_from_version_id,
		  txn.id AS change_id,
		  txn.untracked,
		  'pending' AS commit_id,
		  json(txn.metadata) AS metadata,
		  1 AS priority
		FROM internal_transaction_state txn
		${options.paramsAvailable ? `JOIN params p ON p.version_id = txn.version_id` : ""}
		${buildFilterClauses("txn", options.schemaFilter, options.entityFilter)}
	`).trim();
}

function buildCandidateUntrackedSegment(
	options: CandidateSegmentOptions
): string {
	return stripIndent(`
		SELECT
		  'U' || '~' || lix_encode_pk_part(u.file_id) || '~' || lix_encode_pk_part(u.entity_id) || '~' || lix_encode_pk_part(u.version_id) AS _pk,
		  u.entity_id,
		  u.schema_key,
		  u.file_id,
		  u.plugin_key,
		  json(u.snapshot_content) AS snapshot_content,
		  u.schema_version,
		  u.version_id AS src_version_id,
		  u.version_id AS dst_version_id,
		  u.created_at,
		  u.updated_at,
		  NULL AS inherited_from_version_id,
		  'untracked' AS change_id,
		  1 AS untracked,
		  'untracked' AS commit_id,
		  NULL AS metadata,
		  2 AS priority
		FROM internal_state_all_untracked u
		${options.paramsAvailable ? `JOIN params p ON p.version_id = u.version_id` : ""}
		WHERE (
		  (u.inheritance_delete_marker = 0 AND u.snapshot_content IS NOT NULL) OR
		  (u.inheritance_delete_marker = 1 AND u.snapshot_content IS NULL)
		)
		${buildFilterClauses("u", options.schemaFilter, options.entityFilter, { indentLevel: 3, hasWhere: true })}
	`).trim();
}

function buildCandidateCacheSegment(options: CandidateSegmentOptions): string {
	return stripIndent(`
		SELECT
		  'C' || '~' || lix_encode_pk_part(c.file_id) || '~' || lix_encode_pk_part(c.entity_id) || '~' || lix_encode_pk_part(c.version_id) AS _pk,
		  c.entity_id,
		  c.schema_key,
		  c.file_id,
		  c.plugin_key,
		  json(c.snapshot_content) AS snapshot_content,
		  c.schema_version,
		  c.version_id AS src_version_id,
		  c.version_id AS dst_version_id,
		  c.created_at,
		  c.updated_at,
		  c.inherited_from_version_id,
		  c.change_id,
		  0 AS untracked,
		  c.commit_id,
		  NULL AS metadata,
		  3 AS priority
		FROM ${CACHE_SOURCE_TOKEN} c
		${options.paramsAvailable ? `JOIN params p ON p.version_id = c.version_id` : ""}
		WHERE (
		  (c.inheritance_delete_marker = 0 AND c.snapshot_content IS NOT NULL) OR
		  (c.inheritance_delete_marker = 1 AND c.snapshot_content IS NULL)
		)
		${buildFilterClauses("c", options.schemaFilter, options.entityFilter, { indentLevel: 3, hasWhere: true })}
	`).trim();
}

function buildCandidateInheritedCacheSegment(
	options: CandidateSegmentOptions
): string {
	return stripIndent(`
		SELECT
		  'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
		  isc.entity_id,
		  isc.schema_key,
		  isc.file_id,
		  isc.plugin_key,
		  json(isc.snapshot_content) AS snapshot_content,
		  isc.schema_version,
		  isc.version_id AS src_version_id,
		  vi.version_id AS dst_version_id,
		  isc.created_at,
		  isc.updated_at,
		  isc.version_id AS inherited_from_version_id,
		  isc.change_id,
		  0 AS untracked,
		  isc.commit_id,
		  NULL AS metadata,
		  4 AS priority
		FROM version_inheritance vi
		JOIN ${CACHE_SOURCE_TOKEN} isc ON isc.version_id = vi.ancestor_version_id
		WHERE isc.inheritance_delete_marker = 0
		  AND isc.snapshot_content IS NOT NULL
		${buildFilterClauses("isc", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCandidateInheritedUntrackedSegment(
	options: CandidateSegmentOptions
): string {
	return stripIndent(`
		SELECT
		  'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
		  unt.entity_id,
		  unt.schema_key,
		  unt.file_id,
		  unt.plugin_key,
		  json(unt.snapshot_content) AS snapshot_content,
		  unt.schema_version,
		  unt.version_id AS src_version_id,
		  vi.version_id AS dst_version_id,
		  unt.created_at,
		  unt.updated_at,
		  unt.version_id AS inherited_from_version_id,
		  'untracked' AS change_id,
		  1 AS untracked,
		  'untracked' AS commit_id,
		  NULL AS metadata,
		  5 AS priority
		FROM version_inheritance vi
		JOIN internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
		WHERE unt.inheritance_delete_marker = 0
		  AND unt.snapshot_content IS NOT NULL
		${buildFilterClauses("unt", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCandidateInheritedTransactionSegment(
	options: CandidateSegmentOptions
): string {
	return stripIndent(`
		SELECT
		  'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
		  txn.entity_id,
		  txn.schema_key,
		  txn.file_id,
		  txn.plugin_key,
		  json(txn.snapshot_content) AS snapshot_content,
		  txn.schema_version,
		  txn.version_id AS src_version_id,
		  vi.version_id AS dst_version_id,
		  txn.created_at,
		  txn.created_at AS updated_at,
		  vi.parent_version_id AS inherited_from_version_id,
		  txn.id AS change_id,
		  txn.untracked,
		  'pending' AS commit_id,
		  json(txn.metadata) AS metadata,
		  6 AS priority
		FROM version_parent vi
		JOIN internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL
		${buildFilterClauses("txn", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCacheRoutingSql(schemaKeys: string[]): string {
	return schemaKeys
		.map((key) => {
			const sanitized = sanitizeSchemaKey(key);
			const tableName = `internal_state_cache_${sanitized}`;
			return stripIndent(`
        SELECT *
        FROM ${tableName}
      `);
		})
		.join("\nUNION ALL\n");
}

function sanitizeSchemaKey(key: string): string {
	return key.replace(/[^a-zA-Z0-9]/g, "_");
}

function buildVersionCtes(shapes: Shape[]): VersionCteResult {
	const literalSeeds = collectLiteralVersionSeeds(shapes);
	if (literalSeeds) {
		return buildSeededVersionCtesFromLiterals(literalSeeds);
	}

	const placeholderToken = collectVersionPlaceholderToken(shapes);
	if (placeholderToken) {
		return buildSeededVersionCtesFromToken(placeholderToken);
	}

	return buildUnseededVersionCtes();
}

function buildSeededVersionCtesFromLiterals(seeds: string[]): VersionCteResult {
	const seedSelects = seeds
		.map((version) => `SELECT '${escapeLiteral(version)}' AS version_id`)
		.join("\n        UNION\n        ");

	const sql = stripIndent(`
		WITH RECURSIVE
		  params(version_id) AS (
		    ${seedSelects}
		  ),
		  version_descriptor_base AS (
		    SELECT
		      json_extract(desc.snapshot_content, '$.id') AS version_id,
		      json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
		    FROM internal_state_cache_lix_version_descriptor desc
		  ),
		  version_inheritance(version_id, ancestor_version_id) AS (
		    SELECT
		      p.version_id,
		      vdb.inherits_from_version_id
		    FROM params p
		    JOIN version_descriptor_base vdb ON vdb.version_id = p.version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL

		    UNION ALL

		    SELECT
		      vi.version_id,
		      vdb.inherits_from_version_id
		    FROM version_inheritance vi
		    JOIN version_descriptor_base vdb ON vdb.version_id = vi.ancestor_version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL
		  ),
		  version_parent AS (
		    SELECT
		      p.version_id,
		      vdb.inherits_from_version_id AS parent_version_id
		    FROM params p
		    JOIN version_descriptor_base vdb ON vdb.version_id = p.version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL
		  )
	`);
	return { sql, paramsAvailable: true };
}

function buildSeededVersionCtesFromToken(token: string): VersionCteResult {
	const sql = stripIndent(`
		WITH RECURSIVE
		  params(version_id) AS (
		    SELECT ${token}
		  ),
		  version_descriptor_base AS (
		    SELECT
		      json_extract(desc.snapshot_content, '$.id') AS version_id,
		      json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
		    FROM internal_state_cache_lix_version_descriptor desc
		  ),
		  version_inheritance(version_id, ancestor_version_id) AS (
		    SELECT
		      p.version_id,
		      vdb.inherits_from_version_id
		    FROM params p
		    JOIN version_descriptor_base vdb ON vdb.version_id = p.version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL

		    UNION ALL

		    SELECT
		      vi.version_id,
		      vdb.inherits_from_version_id
		    FROM version_inheritance vi
		    JOIN version_descriptor_base vdb ON vdb.version_id = vi.ancestor_version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL
		  ),
		  version_parent AS (
		    SELECT
		      p.version_id,
		      vdb.inherits_from_version_id AS parent_version_id
		    FROM params p
		    JOIN version_descriptor_base vdb ON vdb.version_id = p.version_id
		    WHERE vdb.inherits_from_version_id IS NOT NULL
		  )
	`);
	return { sql, paramsAvailable: true };
}

function collectLiteralVersionSeeds(shapes: Shape[]): string[] | null {
	const literals = new Set<string>();
	for (const shape of shapes) {
		switch (shape.versionId.kind) {
			case "literal":
				literals.add(shape.versionId.value);
				break;
			case "unknown":
			case "placeholder":
			case "current":
				return null;
		}
	}
	if (literals.size === 0) {
		return null;
	}
	return [...literals];
}

function collectVersionPlaceholderToken(shapes: Shape[]): string | null {
	let token: string | null = null;
	for (const shape of shapes) {
		switch (shape.versionId.kind) {
			case "placeholder":
				if (!shape.versionId.token) return null;
				const image = shape.versionId.token.image;
				if (!image || image === "?") {
					return null;
				}
				if (token && token !== image) {
					return null;
				}
				token = image;
				break;
			case "literal":
				// literals handled separately
				break;
			default:
				return null;
		}
	}
	return token;
}

function buildUnseededVersionCtes(): VersionCteResult {
	const sql = stripIndent(`
    WITH RECURSIVE
      version_descriptor_base AS (
        SELECT
          json_extract(desc.snapshot_content, '$.id') AS version_id,
          json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
        FROM internal_state_cache_lix_version_descriptor desc
      ),
      version_inheritance(version_id, ancestor_version_id) AS (
        SELECT
          vdb.version_id,
          vdb.inherits_from_version_id
        FROM version_descriptor_base vdb
        WHERE vdb.inherits_from_version_id IS NOT NULL

        UNION ALL

        SELECT
          vir.version_id,
          vdb.inherits_from_version_id
        FROM version_inheritance vir
        JOIN version_descriptor_base vdb ON vdb.version_id = vir.ancestor_version_id
        WHERE vdb.inherits_from_version_id IS NOT NULL
      ),
      version_parent AS (
        SELECT
          vdb.version_id,
          vdb.inherits_from_version_id AS parent_version_id
        FROM version_descriptor_base vdb
        WHERE vdb.inherits_from_version_id IS NOT NULL
      )
	  `);
	return { sql, paramsAvailable: false };
}

type LiteralOrPlaceholder =
	| { kind: "literal"; value: string }
	| { kind: "placeholder"; token?: string };

function pickSingleLiteral(values: LiteralOrPlaceholder[]): string | undefined {
	const literals = values.filter(
		(entry): entry is { kind: "literal"; value: string } =>
			entry.kind === "literal"
	);
	if (literals.length !== 1) return undefined;
	return literals[0]!.value;
}

function stripIndent(value: string): string {
	const trimmed = value.replace(/^\n+/, "").replace(/\n+$/, "");
	const lines = trimmed.split("\n");
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^\s*/)?.[0]?.length ?? 0);
	const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((line) => line.slice(minIndent)).join("\n");
}

function indent(value: string, spaces: number): string {
	const pad = " ".repeat(Math.max(spaces, 0));
	return value
		.split("\n")
		.map((line) => (line.trim().length === 0 ? line : `${pad}${line}`))
		.join("\n");
}

function escapeLiteral(value: string): string {
	return value.replace(/'/g, "''");
}

const VISIBLE_STATE_COLUMNS = [
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
];

function buildFilterClauses(
	alias: string,
	schemaFilter: ColumnFilter | null,
	entityFilter: ColumnFilter | null,
	options: { indentLevel?: number; hasWhere?: boolean } = {}
): string {
	const clauses: string[] = [];
	if (schemaFilter)
		clauses.push(buildColumnClause(alias, "schema_key", schemaFilter));
	if (entityFilter)
		clauses.push(buildColumnClause(alias, "entity_id", entityFilter));
	if (clauses.length === 0) return "";
	const indentLevel = options.indentLevel ?? 2;
	const hasWhere = options.hasWhere ?? false;
	const indent = " ".repeat(indentLevel * 2);
	let sql = `\n${indent}${hasWhere ? "AND" : "WHERE"} ${clauses[0]}`;
	for (let i = 1; i < clauses.length; i++) {
		sql += `\n${indent}AND ${clauses[i]}`;
	}
	return sql;
}

function buildColumnClause(
	alias: string,
	column: string,
	filter: ColumnFilter
): string {
	if (filter.placeholder) {
		return `${alias}.${column} = ${filter.placeholder}`;
	}
	if (filter.literals.length === 1) {
		return `${alias}.${column} = '${escapeLiteral(filter.literals[0]!)}'`;
	}
	const list = filter.literals
		.map((value) => `'${escapeLiteral(value)}'`)
		.join(", ");
	return `${alias}.${column} IN (${list})`;
}

function collectColumnFilter(
	shapes: Shape[],
	column: "schema_key" | "entity_id"
): ColumnFilter | null {
	const literals = new Set<string>();
	let placeholder: string | null = null;

	for (const shape of shapes) {
		const values = column === "schema_key" ? shape.schemaKeys : shape.entityIds;
		for (const value of values) {
			if (value.kind === "literal") {
				literals.add(value.value);
			} else {
				const image = value.token?.image;
				if (!image || image === "?") {
					return null;
				}
				if (placeholder && placeholder !== image) {
					return null;
				}
				placeholder = image;
			}
		}
	}

	if (placeholder) {
		if (literals.size > 0) return null;
		return { literals: [], placeholder };
	}
	if (literals.size === 0) {
		return null;
	}
	return { literals: [...literals].sort() };
}

function maybeStripHiddenPrimaryKey(
	sql: string,
	includePrimaryKey: boolean
): string {
	if (includePrimaryKey) {
		return sql;
	}

	const projection = VISIBLE_STATE_COLUMNS.join(", ");
	return stripIndent(`
    SELECT ${projection}
    FROM (
      ${sql}
    )
  `);
}
