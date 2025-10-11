import type { PlaceholderValue, Shape } from "../microparser/analyze-shape.js";

type TransactionOption = {
	includeTransaction?: boolean;
	existingCacheTables?: Set<string>;
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
		existingCacheTables: options?.existingCacheTables,
	});
	const cteBody = stripIndent(`
		-- hoisted_lix_internal_state_vtable_rewrite
		lix_internal_state_vtable_rewritten AS (
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
	return `(SELECT ${projection} FROM lix_internal_state_vtable_rewritten) AS ${aliasSql}`;
}

/**
 * Build a replacement subquery for `lix_internal_state_vtable`.
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
		existingCacheTables: options?.existingCacheTables,
	});
	return maybeStripHiddenPrimaryKey(canonicalQuery, includePrimaryKey);
}

interface InternalStateVtableQueryOptions {
	shapes: Shape[];
	schemaKeys: string[];
	includeTransaction: boolean;
	existingCacheTables?: Set<string>;
}

interface VersionCteResult {
	sql: string;
	paramsAvailable: boolean;
}

const CACHE_SOURCE_TOKEN = "__CACHE_SOURCE__";
const CACHE_PROJECTION =
	"entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id, created_at, updated_at, inherited_from_version_id, inheritance_delete_marker, change_id, commit_id";

const PARAM_COLUMN_ORDER: ParamColumn[] = [
	"version_id",
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
];

type ParamColumn =
	| "entity_id"
	| "version_id"
	| "schema_key"
	| "file_id"
	| "plugin_key";

type ParamBinding =
	| { kind: "literal"; value: string }
	| { kind: "placeholder"; token: string };

type ParamBindings = Map<ParamColumn, ParamBinding>;

function buildInternalStateVtableQuery(
	options: InternalStateVtableQueryOptions
): string {
	const { sql: cacheSource, includeCache } = buildCacheRouting(
		options.schemaKeys,
		options.existingCacheTables
	);

	const versionBinding = collectVersionBinding(options.shapes);
	let paramBindings = buildParamBindings(options.shapes, versionBinding);
	const versionCtes = buildVersionCtes(
		options.shapes,
		versionBinding,
		paramBindings
	);
	const schemaFilter = collectColumnFilter(options.shapes, "schema_key");
	const entityFilter = collectColumnFilter(options.shapes, "entity_id");
	const fileFilter = collectColumnFilter(options.shapes, "file_id");
	const pluginFilter = collectColumnFilter(options.shapes, "plugin_key");
	const paramsClauseNeeded =
		!versionCtes.paramsAvailable && paramBindings && paramBindings.size > 0;
	let paramsClause = "";
	let paramsAvailable = versionCtes.paramsAvailable;
	if (paramsClauseNeeded && paramBindings) {
		paramsClause = buildParamsCteClause(paramBindings);
		if (paramsClause) {
			paramsAvailable = true;
		}
	}

	const paramColumns = paramBindings
		? new Set<ParamColumn>(paramBindings.keys())
		: null;
	const candidatesBody = buildCandidatesBody({
		includeTransaction: options.includeTransaction,
		paramsAvailable,
		paramColumns,
		schemaFilter,
		entityFilter,
		fileFilter,
		pluginFilter,
		includeCache,
	});
	const rankedBody = buildRankedBody();
	const metadataExpression = options.includeTransaction
		? "COALESCE(w.metadata, json(chc.metadata), json(itx.metadata))"
		: "COALESCE(w.metadata, json(chc.metadata))";
	const transactionWriterJoin = options.includeTransaction
		? stripIndent(`
LEFT JOIN lix_internal_transaction_state itx ON itx.id = w.change_id
		`)
		: "";
	const finalSelect = stripIndent(`
SELECT
  w._pk,
  w.entity_id,
  w.schema_key,
  w.file_id,
  w.plugin_key,
  w.snapshot_content,
  w.schema_version,
  w.version_id,
  w.created_at,
  w.updated_at,
  w.inherited_from_version_id,
  w.change_id,
  w.untracked,
  w.commit_id,
  ${metadataExpression} AS metadata,
  COALESCE(ws_dst.writer_key, ws_src.writer_key) AS writer_key
FROM ranked w
LEFT JOIN lix_internal_state_writer ws_dst ON
  ws_dst.file_id = w.file_id AND
  ws_dst.entity_id = w.entity_id AND
  ws_dst.schema_key = w.schema_key AND
  ws_dst.version_id = w.version_id
LEFT JOIN lix_internal_state_writer ws_src ON
  ws_src.file_id = w.file_id AND
  ws_src.entity_id = w.entity_id AND
  ws_src.schema_key = w.schema_key AND
  ws_src.version_id = COALESCE(w.inherited_from_version_id, w.version_id)
LEFT JOIN lix_internal_change chc ON chc.id = w.change_id
${transactionWriterJoin}
WHERE w.rn = 1
	`);

	let cteSql = versionCtes.sql;
	if (paramsClause) {
		cteSql += `,\n  ${paramsClause}`;
	}

	const sql =
		`${cteSql},
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
	paramColumns?: Set<ParamColumn> | null;
	schemaFilter: ColumnFilter | null;
	entityFilter: ColumnFilter | null;
	fileFilter?: ColumnFilter | null;
	pluginFilter?: ColumnFilter | null;
}

function buildCandidatesBody(options: {
	includeTransaction: boolean;
	paramsAvailable: boolean;
	paramColumns: Set<ParamColumn> | null;
	schemaFilter: ColumnFilter | null;
	entityFilter: ColumnFilter | null;
	fileFilter: ColumnFilter | null;
	pluginFilter: ColumnFilter | null;
	includeCache: boolean;
}): string {
	const segments: string[] = [];
	if (options.includeTransaction) {
		segments.push(
			buildCandidateTransactionSegment({
				paramsAvailable: options.paramsAvailable,
				paramColumns: options.paramColumns,
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
				fileFilter: options.fileFilter,
				pluginFilter: options.pluginFilter,
			})
		);
	}
	segments.push(
		buildCandidateUntrackedSegment({
			paramsAvailable: options.paramsAvailable,
			paramColumns: options.paramColumns,
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
			fileFilter: options.fileFilter,
			pluginFilter: options.pluginFilter,
		})
	);

	if (options.includeCache) {
		segments.push(
			buildCandidateCacheSegment({
				paramsAvailable: options.paramsAvailable,
				paramColumns: options.paramColumns,
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
				fileFilter: options.fileFilter,
				pluginFilter: options.pluginFilter,
			}),
			buildCandidateInheritedCacheSegment({
				paramsAvailable: options.paramsAvailable,
				paramColumns: options.paramColumns,
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
				fileFilter: options.fileFilter,
				pluginFilter: options.pluginFilter,
			})
		);
	}

	segments.push(
		buildCandidateInheritedUntrackedSegment({
			paramsAvailable: options.paramsAvailable,
			paramColumns: options.paramColumns,
			schemaFilter: options.schemaFilter,
			entityFilter: options.entityFilter,
			fileFilter: options.fileFilter,
			pluginFilter: options.pluginFilter,
		})
	);
	if (options.includeTransaction) {
		segments.push(
			buildCandidateInheritedTransactionSegment({
				paramsAvailable: options.paramsAvailable,
				paramColumns: options.paramColumns,
				schemaFilter: options.schemaFilter,
				entityFilter: options.entityFilter,
				fileFilter: options.fileFilter,
				pluginFilter: options.pluginFilter,
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
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			entity_id: "txn.entity_id",
			version_id: "txn.version_id",
			schema_key: "txn.schema_key",
			file_id: "txn.file_id",
			plugin_key: "txn.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		FROM lix_internal_transaction_state txn${paramsJoin}
		${buildFilterClauses("txn", options.schemaFilter, options.entityFilter)}
	`).trim();
}

function buildCandidateUntrackedSegment(
	options: CandidateSegmentOptions
): string {
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			entity_id: "u.entity_id",
			version_id: "u.version_id",
			schema_key: "u.schema_key",
			file_id: "u.file_id",
			plugin_key: "u.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		FROM lix_internal_state_all_untracked u${paramsJoin}
		WHERE (
		  (u.inheritance_delete_marker = 0 AND u.snapshot_content IS NOT NULL) OR
		  (u.inheritance_delete_marker = 1 AND u.snapshot_content IS NULL)
		)
		${buildFilterClauses("u", options.schemaFilter, options.entityFilter, { indentLevel: 3, hasWhere: true })}
	`).trim();
}

function buildCandidateCacheSegment(options: CandidateSegmentOptions): string {
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			entity_id: "c.entity_id",
			version_id: "c.version_id",
			schema_key: "c.schema_key",
			file_id: "c.file_id",
			plugin_key: "c.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		FROM ${CACHE_SOURCE_TOKEN} c${paramsJoin}
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
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			version_id: "vi.version_id",
			entity_id: "isc.entity_id",
			schema_key: "isc.schema_key",
			file_id: "isc.file_id",
			plugin_key: "isc.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		JOIN ${CACHE_SOURCE_TOKEN} isc ON isc.version_id = vi.ancestor_version_id${paramsJoin}
		WHERE isc.inheritance_delete_marker = 0
		  AND isc.snapshot_content IS NOT NULL
		${buildFilterClauses("isc", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCandidateInheritedUntrackedSegment(
	options: CandidateSegmentOptions
): string {
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			version_id: "vi.version_id",
			entity_id: "unt.entity_id",
			schema_key: "unt.schema_key",
			file_id: "unt.file_id",
			plugin_key: "unt.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id${paramsJoin}
		WHERE unt.inheritance_delete_marker = 0
		  AND unt.snapshot_content IS NOT NULL
		${buildFilterClauses("unt", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCandidateInheritedTransactionSegment(
	options: CandidateSegmentOptions
): string {
	const paramsJoin = buildParamsJoinClause(
		options.paramsAvailable ?? false,
		options.paramColumns ?? null,
		{
			version_id: "vi.version_id",
			entity_id: "txn.entity_id",
			schema_key: "txn.schema_key",
			file_id: "txn.file_id",
			plugin_key: "txn.plugin_key",
		},
		{ indentLevel: 2 }
	);
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
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id${paramsJoin}
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL
		${buildFilterClauses("txn", options.schemaFilter, options.entityFilter, { indentLevel: 2, hasWhere: true })}
	`).trim();
}

function buildCacheRouting(
	schemaKeys: string[],
	existingCacheTables?: Set<string>
): { sql: string; includeCache: boolean } {
	const tableExists = (name: string): boolean => {
		if (!existingCacheTables) return true;
		return existingCacheTables.has(name);
	};

	const uniqueCandidates = new Set<string>();
	if (schemaKeys.length > 0) {
		for (const key of schemaKeys) {
			uniqueCandidates.add(`lix_internal_state_cache_${sanitizeSchemaKey(key)}`);
		}
	} else if (!existingCacheTables) {
		uniqueCandidates.add("lix_internal_state_cache");
	} else if (existingCacheTables.has("lix_internal_state_cache")) {
		uniqueCandidates.add("lix_internal_state_cache");
	} else {
		for (const name of existingCacheTables) {
			if (name.startsWith("lix_internal_state_cache_")) {
				uniqueCandidates.add(name);
			}
		}
	}

	const existing = [...uniqueCandidates].filter((name) => tableExists(name));
	if (existing.length === 0) {
		return { sql: buildEmptyCacheSourceSql(), includeCache: false };
	}

	const unionBody = existing
		.map((name) => `SELECT ${CACHE_PROJECTION} FROM ${name}`)
		.join("\nUNION ALL\n");
	return { sql: `(${unionBody})`, includeCache: true };
}

function buildEmptyCacheSourceSql(): string {
	return stripIndent(`
		(SELECT
		  CAST(NULL AS TEXT)    AS entity_id,
		  CAST(NULL AS TEXT)    AS schema_key,
		  CAST(NULL AS TEXT)    AS file_id,
		  CAST(NULL AS TEXT)    AS plugin_key,
		  CAST(NULL AS TEXT)    AS snapshot_content,
		  CAST(NULL AS TEXT)    AS schema_version,
		  CAST(NULL AS TEXT)    AS version_id,
		  CAST(NULL AS TEXT)    AS created_at,
		  CAST(NULL AS TEXT)    AS updated_at,
		  CAST(NULL AS TEXT)    AS inherited_from_version_id,
		  CAST(NULL AS INTEGER) AS inheritance_delete_marker,
		  CAST(NULL AS TEXT)    AS change_id,
		  CAST(NULL AS TEXT)    AS commit_id
		  WHERE 0)
	`).trim();
}

function sanitizeSchemaKey(key: string): string {
	return key.replace(/[^a-zA-Z0-9]/g, "_");
}

function buildVersionCtes(
	shapes: Shape[],
	versionBinding: ParamBinding | null,
	paramBindings: ParamBindings | null
): VersionCteResult {
	if (versionBinding?.kind === "literal") {
		return buildSeededVersionCtesFromLiteral(
			versionBinding.value,
			withVersionBinding(paramBindings, versionBinding)
		);
	}

	if (versionBinding?.kind === "placeholder") {
		return buildSeededVersionCtesFromToken(
			versionBinding.token,
			withVersionBinding(paramBindings, versionBinding)
		);
	}

	return buildUnseededVersionCtes();
}

function buildSeededVersionCtesFromLiteral(
	value: string,
	paramBindings: ParamBindings
): VersionCteResult {
	const paramsClause = buildParamsCteClause(paramBindings);
	const sql = stripIndent(`
		WITH RECURSIVE
		  ${paramsClause},
		  version_descriptor_base AS (
		    SELECT
		      json_extract(desc.snapshot_content, '$.id') AS version_id,
		      json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
		    FROM lix_internal_state_cache_lix_version_descriptor desc
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

function buildSeededVersionCtesFromToken(
	_token: string,
	paramBindings: ParamBindings
): VersionCteResult {
	const paramsClause = buildParamsCteClause(paramBindings);
	const sql = stripIndent(`
		WITH RECURSIVE
		  ${paramsClause},
		  version_descriptor_base AS (
		    SELECT
		      json_extract(desc.snapshot_content, '$.id') AS version_id,
		      json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
		    FROM lix_internal_state_cache_lix_version_descriptor desc
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

function buildParamBindings(
	shapes: Shape[],
	versionBinding: ParamBinding | null
): ParamBindings | null {
	const bindings = new Map<ParamColumn, ParamBinding>();
	if (versionBinding) {
		bindings.set("version_id", versionBinding);
	}

	const entityBinding = collectColumnBinding(
		shapes,
		(shape) => shape.entityIds
	);
	if (entityBinding) bindings.set("entity_id", entityBinding);

	const schemaBinding = collectColumnBinding(
		shapes,
		(shape) => shape.schemaKeys
	);
	if (schemaBinding) bindings.set("schema_key", schemaBinding);

	const fileBinding = collectColumnBinding(shapes, (shape) => shape.fileIds);
	if (fileBinding) bindings.set("file_id", fileBinding);

	const pluginBinding = collectColumnBinding(
		shapes,
		(shape) => shape.pluginKeys
	);
	if (pluginBinding) bindings.set("plugin_key", pluginBinding);

	if (bindings.size === 0) {
		return null;
	}

	const ordered = new Map<ParamColumn, ParamBinding>();
	for (const column of PARAM_COLUMN_ORDER) {
		const binding = bindings.get(column);
		if (binding) {
			ordered.set(column, binding);
		}
	}
	return ordered;
}

function withVersionBinding(
	paramBindings: ParamBindings | null,
	versionBinding: ParamBinding
): ParamBindings {
	const next = new Map<ParamColumn, ParamBinding>();
	for (const [column, binding] of paramBindings ?? []) {
		next.set(column, binding);
	}
	next.set("version_id", versionBinding);
	return next;
}

function collectVersionBinding(shapes: Shape[]): ParamBinding | null {
	let binding: ParamBinding | null = null;
	for (const shape of shapes) {
		const candidate = deriveVersionBinding(shape);
		if (!candidate) {
			return null;
		}
		if (!binding) {
			binding = candidate;
			continue;
		}
		if (!paramBindingsEqual(binding, candidate)) {
			return null;
		}
	}
	return binding;
}

function deriveVersionBinding(shape: Shape): ParamBinding | null {
	switch (shape.versionId.kind) {
		case "literal":
			return { kind: "literal", value: shape.versionId.value };
		case "placeholder": {
			const token = shape.versionId.token?.image;
			if (!token || token === "?") {
				return null;
			}
			return { kind: "placeholder", token };
		}
		default:
			return null;
	}
}

function collectColumnBinding(
	shapes: Shape[],
	extractor: (
		shape: Shape
	) => Array<{ kind: "literal"; value: string } | PlaceholderValue>
): ParamBinding | null {
	let binding: ParamBinding | null = null;
	for (const shape of shapes) {
		const values = extractor(shape);
		const candidate = extractBindingFromValues(values);
		if (!candidate) {
			return null;
		}
		if (!binding) {
			binding = candidate;
			continue;
		}
		if (!paramBindingsEqual(binding, candidate)) {
			return null;
		}
	}
	return binding;
}

function extractBindingFromValues(
	values: Array<{ kind: "literal"; value: string } | PlaceholderValue>
): ParamBinding | null {
	if (values.length === 0) return null;
	let literal: string | undefined;
	let placeholder: string | undefined;
	for (const value of values) {
		if (value.kind === "literal") {
			if (literal !== undefined && literal !== value.value) {
				return null;
			}
			literal = value.value;
			continue;
		}
		if (value.kind === "placeholder") {
			const token = value.token?.image;
			if (!token || token === "?") {
				return null;
			}
			if (placeholder !== undefined && placeholder !== token) {
				return null;
			}
			placeholder = token;
		}
	}
	if (literal !== undefined && placeholder !== undefined) {
		return null;
	}
	if (placeholder !== undefined) {
		return { kind: "placeholder", token: placeholder };
	}
	if (literal !== undefined) {
		return { kind: "literal", value: literal };
	}
	return null;
}

function paramBindingsEqual(a: ParamBinding, b: ParamBinding): boolean {
	if (a.kind !== b.kind) return false;
	if (a.kind === "literal" && b.kind === "literal") {
		return a.value === b.value;
	}
	if (a.kind === "placeholder" && b.kind === "placeholder") {
		return a.token === b.token;
	}
	return false;
}

function buildParamsCteClause(paramBindings: ParamBindings): string {
	if (paramBindings.size === 0) {
		throw new Error("Attempted to build params CTE without bindings");
	}
	const columns: ParamColumn[] = [];
	const expressions: string[] = [];
	for (const column of PARAM_COLUMN_ORDER) {
		const binding = paramBindings.get(column);
		if (!binding) continue;
		columns.push(column);
		const expr =
			binding.kind === "literal"
				? `'${escapeLiteral(binding.value)}'`
				: binding.token;
		expressions.push(`${expr} AS ${column}`);
	}
	const selectBody = expressions
		.map(
			(expression, index) =>
				`        ${expression}${index === expressions.length - 1 ? "" : ","}`
		)
		.join("\n");
	return stripIndent(`
		params(${columns.join(", ")}) AS (
		  SELECT
	${selectBody}
		)
	`).trim();
}

function buildUnseededVersionCtes(): VersionCteResult {
	const sql = stripIndent(`
    WITH RECURSIVE
      version_descriptor_base AS (
        SELECT
          json_extract(desc.snapshot_content, '$.id') AS version_id,
          json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
        FROM lix_internal_state_cache_lix_version_descriptor desc
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

type ShapeLiteral = { kind: "literal"; value: string };

function pickSingleLiteral(
	values: Array<ShapeLiteral | PlaceholderValue>
): string | undefined {
	const literals = values.filter(
		(entry): entry is ShapeLiteral => entry.kind === "literal"
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
	column: "schema_key" | "entity_id" | "file_id" | "plugin_key"
): ColumnFilter | null {
	const literals = new Set<string>();
	let placeholder: string | null = null;

	for (const shape of shapes) {
		let values:
			| Shape["schemaKeys"]
			| Shape["entityIds"]
			| Shape["fileIds"]
			| Shape["pluginKeys"];
		switch (column) {
			case "schema_key":
				values = shape.schemaKeys;
				break;
			case "entity_id":
				values = shape.entityIds;
				break;
			case "file_id":
				values = shape.fileIds;
				break;
			case "plugin_key":
				values = shape.pluginKeys;
				break;
		}
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

function buildParamsJoinClause(
	hasParams: boolean,
	paramColumns: Set<ParamColumn> | null,
	mapping: Partial<Record<ParamColumn, string>>,
	options: { indentLevel?: number } = {}
): string {
	if (!hasParams || !paramColumns || paramColumns.size === 0) {
		return "";
	}

	const clauses: string[] = [];
	for (const [column, expression] of Object.entries(mapping) as Array<
		[ParamColumn, string | undefined]
	>) {
		if (!expression) continue;
		if (!paramColumns.has(column)) continue;
		clauses.push(`p.${column} = ${expression}`);
	}

	if (clauses.length === 0) {
		return "";
	}

	const indentLevel = options.indentLevel ?? 2;
	const indent = " ".repeat(indentLevel * 2);
	const clauseIndent = " ".repeat((indentLevel + 1) * 2);

	const lines = clauses.map(
		(clause, index) => `${clauseIndent}${index === 0 ? "" : "AND "}${clause}`
	);

	return `\n${indent}JOIN params p ON\n${lines.join("\n")}`;
}
