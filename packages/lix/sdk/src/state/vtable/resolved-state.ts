import { sql, type SelectQueryBuilder } from "kysely";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { selectFromStateCache } from "../cache/select-from-state-cache.js";
import type { StateAllView } from "../views/state-all.js";

export interface ResolvedStateQueryOptions {
	cacheRouting?: {
		schemaKeys: readonly string[];
	};
}

const CACHE_SOURCE_TOKEN = "__CACHE_SOURCE__";

function buildResolvedStateSql(options?: ResolvedStateQueryOptions): string {
	const schemaKeys = options?.cacheRouting?.schemaKeys ?? [];
	if (schemaKeys.length === 0) {
		return buildBaseResolvedStateSql().replaceAll(
			CACHE_SOURCE_TOKEN,
			"lix_internal_state_cache"
		);
	}

	const cacheSql = buildCacheRoutingSql(schemaKeys);
	return buildBaseResolvedStateSql().replaceAll(
		CACHE_SOURCE_TOKEN,
		`(${cacheSql})`
	);
}

function buildCacheRoutingSql(schemaKeys: readonly string[]): string {
	const statements = schemaKeys.map(compileCacheSelectStatement);
	if (statements.length === 1) {
		return statements[0]!;
	}

	return statements.join("\nUNION ALL\n");
}

function compileCacheSelectStatement(schemaKey: string): string {
	const compiled = selectFromStateCache(schemaKey).selectAll().compile();
	if (compiled.parameters.length > 0) {
		throw new Error(
			"selectFromStateCache generated parameterised SQL which is not supported"
		);
	}
	const match = compiled.sql.match(
		/^select\s+\*\s+from\s*\((?<inner>select[\s\S]+)\)\s+as\s+"lix_internal_state_cache_routed"$/i
	);
	return match?.groups?.inner?.trim() ?? compiled.sql;
}

function buildBaseResolvedStateSql(): string {
	return [buildVersionCtes(), buildResolvedSelectBody()].join("\n");
}

function buildVersionCtes(): string {
	return stripIndent(`
		WITH RECURSIVE
			version_descriptor_base AS (
				SELECT
					json_extract(isc_v.snapshot_content, '$.id') AS version_id,
					json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
				FROM ${CACHE_SOURCE_TOKEN} isc_v
				WHERE isc_v.schema_key = 'lix_version_descriptor'
			),
			version_inheritance(version_id, ancestor_version_id) AS (
				SELECT
					vdb.version_id,
					vdb.inherits_from_version_id
				FROM version_descriptor_base vdb
				WHERE vdb.inherits_from_version_id IS NOT NULL

				UNION

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
}

function buildResolvedSelectBody(): string {
	const segments = [
		buildTransactionSegment(),
		buildUntrackedSegment(),
		buildCachedSegment(),
		buildInheritedCacheSegment(),
		buildInheritedUntrackedSegment(),
		buildInheritedTransactionSegment(),
	];

	return [
		"      SELECT * FROM (",
		segments.join("\n\n\t\tUNION ALL\n\n"),
		"\t\t)",
	].join("\n");
}

function buildTransactionSegment(): string {
	return stripIndent(`
		-- 1. Transaction state (highest priority) - pending changes
		SELECT 
			'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk,
			txn.entity_id,
			txn.schema_key,
			txn.file_id,
			txn.plugin_key,
			json(txn.snapshot_content) AS snapshot_content,
			txn.schema_version,
			txn.version_id,
			txn.created_at,
			txn.created_at AS updated_at,
			NULL AS inherited_from_version_id,
			txn.id AS change_id,
			txn.untracked,
			'pending' AS commit_id,
			json(txn.metadata) AS metadata,
			ws_txn.writer_key
		FROM lix_internal_transaction_state txn
		LEFT JOIN lix_internal_state_writer ws_txn ON
			ws_txn.file_id = txn.file_id AND
			ws_txn.entity_id = txn.entity_id AND
			ws_txn.schema_key = txn.schema_key AND
			ws_txn.version_id = txn.version_id
	`);
}

function buildUntrackedSegment(): string {
	return stripIndent(`
		-- 2. Untracked state (second priority) - only if no transaction exists
		SELECT 
			'U' || '~' || lix_encode_pk_part(u.file_id) || '~' || lix_encode_pk_part(u.entity_id) || '~' || lix_encode_pk_part(u.version_id) AS _pk,
			u.entity_id,
			u.schema_key,
			u.file_id,
			u.plugin_key,
			json(u.snapshot_content) AS snapshot_content,
			u.schema_version,
			u.version_id,
			u.created_at,
			u.updated_at,
			NULL AS inherited_from_version_id,
			'untracked' AS change_id,
			1 AS untracked,
			'untracked' AS commit_id,
			NULL AS metadata,
			ws_untracked.writer_key
		FROM lix_internal_state_all_untracked u
		LEFT JOIN lix_internal_state_writer ws_untracked ON
			ws_untracked.file_id = u.file_id AND
			ws_untracked.entity_id = u.entity_id AND
			ws_untracked.schema_key = u.schema_key AND
			ws_untracked.version_id = u.version_id
		WHERE (
			(u.inheritance_delete_marker = 0 AND u.snapshot_content IS NOT NULL) OR
			(u.inheritance_delete_marker = 1 AND u.snapshot_content IS NULL)
		)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = u.version_id
					AND t.file_id = u.file_id
					AND t.schema_key = u.schema_key
					AND t.entity_id = u.entity_id
			)
	`);
}

function buildCachedSegment(): string {
	return stripIndent(`
		-- 3. Tracked state from cache (third priority) - only if no transaction or untracked exists
		SELECT 
			'C' || '~' || lix_encode_pk_part(c.file_id) || '~' || lix_encode_pk_part(c.entity_id) || '~' || lix_encode_pk_part(c.version_id) AS _pk,
			c.entity_id,
			c.schema_key,
			c.file_id,
			c.plugin_key,
			json(c.snapshot_content) AS snapshot_content,
			c.schema_version,
			c.version_id,
			c.created_at,
			c.updated_at,
			c.inherited_from_version_id,
			c.change_id,
			0 AS untracked,
			c.commit_id,
			ch.metadata AS metadata,
			ws_cache.writer_key
		FROM ${CACHE_SOURCE_TOKEN} c
		LEFT JOIN change ch ON ch.id = c.change_id
		LEFT JOIN lix_internal_state_writer ws_cache ON
			ws_cache.file_id = c.file_id AND
			ws_cache.entity_id = c.entity_id AND
			ws_cache.schema_key = c.schema_key AND
			ws_cache.version_id = c.version_id
		WHERE (
			(c.inheritance_delete_marker = 0 AND c.snapshot_content IS NOT NULL) OR
			(c.inheritance_delete_marker = 1 AND c.snapshot_content IS NULL)
		)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = c.version_id
					AND t.file_id = c.file_id
					AND t.schema_key = c.schema_key
					AND t.entity_id = c.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked u
				WHERE u.version_id = c.version_id
					AND u.file_id = c.file_id
					AND u.schema_key = c.schema_key
					AND u.entity_id = c.entity_id
			)
	`);
}

function buildInheritedCacheSegment(): string {
	return stripIndent(`
		-- 4. Inherited tracked state (fourth priority)
		SELECT 
			'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			isc.entity_id,
			isc.schema_key,
			isc.file_id,
			isc.plugin_key,
			json(isc.snapshot_content) AS snapshot_content,
			isc.schema_version,
			vi.version_id,
			isc.created_at,
			isc.updated_at,
			isc.version_id AS inherited_from_version_id,
			isc.change_id,
			0 AS untracked,
			isc.commit_id,
			ch.metadata AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_inheritance vi
		JOIN ${CACHE_SOURCE_TOKEN} isc ON isc.version_id = vi.ancestor_version_id
		LEFT JOIN change ch ON ch.id = isc.change_id
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = isc.file_id AND
			ws_child.entity_id = isc.entity_id AND
			ws_child.schema_key = isc.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = isc.file_id AND
			ws_parent.entity_id = isc.entity_id AND
			ws_parent.schema_key = isc.schema_key AND
			ws_parent.version_id = isc.version_id
		WHERE isc.inheritance_delete_marker = 0
			AND isc.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = vi.version_id
					AND t.file_id = isc.file_id
					AND t.schema_key = isc.schema_key
					AND t.entity_id = isc.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = isc.file_id
					AND child_isc.schema_key = isc.schema_key
					AND child_isc.entity_id = isc.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = isc.file_id
					AND child_unt.schema_key = isc.schema_key
					AND child_unt.entity_id = isc.entity_id
			)
	`);
}

function buildInheritedUntrackedSegment(): string {
	return stripIndent(`
		-- 5. Inherited untracked state (lowest priority)
		SELECT 
			'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			unt.entity_id,
			unt.schema_key,
			unt.file_id,
			unt.plugin_key,
			json(unt.snapshot_content) AS snapshot_content,
			unt.schema_version,
			vi.version_id,
			unt.created_at,
			unt.updated_at,
			unt.version_id AS inherited_from_version_id,
			'untracked' AS change_id,
			1 AS untracked,
			'untracked' AS commit_id,
			NULL AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_inheritance vi
		JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = unt.file_id AND
			ws_child.entity_id = unt.entity_id AND
			ws_child.schema_key = unt.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = unt.file_id AND
			ws_parent.entity_id = unt.entity_id AND
			ws_parent.schema_key = unt.schema_key AND
			ws_parent.version_id = unt.version_id
		WHERE unt.inheritance_delete_marker = 0
			AND unt.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = vi.version_id
					AND t.file_id = unt.file_id
					AND t.schema_key = unt.schema_key
					AND t.entity_id = unt.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = unt.file_id
					AND child_isc.schema_key = unt.schema_key
					AND child_isc.entity_id = unt.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = unt.file_id
					AND child_unt.schema_key = unt.schema_key
					AND child_unt.entity_id = unt.entity_id
			)
	`);
}

function buildInheritedTransactionSegment(): string {
	return stripIndent(`
		-- 6. Inherited transaction state
		SELECT 
			'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			txn.entity_id,
			txn.schema_key,
			txn.file_id,
			txn.plugin_key,
			json(txn.snapshot_content) AS snapshot_content,
			txn.schema_version,
			vi.version_id,
			txn.created_at,
			txn.created_at AS updated_at,
			vi.parent_version_id AS inherited_from_version_id,
			txn.id AS change_id,
			txn.untracked,
			'pending' AS commit_id,
			json(txn.metadata) AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_parent vi
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = txn.file_id AND
			ws_child.entity_id = txn.entity_id AND
			ws_child.schema_key = txn.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = txn.file_id AND
			ws_parent.entity_id = txn.entity_id AND
			ws_parent.schema_key = txn.schema_key AND
			ws_parent.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
			AND txn.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state child_txn
				WHERE child_txn.version_id = vi.version_id
					AND child_txn.file_id = txn.file_id
					AND child_txn.schema_key = txn.schema_key
					AND child_txn.entity_id = txn.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = txn.file_id
					AND child_isc.schema_key = txn.schema_key
					AND child_isc.entity_id = txn.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = txn.file_id
					AND child_unt.schema_key = txn.schema_key
					AND child_unt.entity_id = txn.entity_id
			)
	`);
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

const RESOLVED_ALIAS = "lix_internal_resolved_state_all";

export type ResolvedStateRow = Omit<StateAllView, "snapshot_content"> & {
	/**
	 * Primary key in format: tag~file_id~entity_id~version_id
	 * where tag is T (transaction), U (untracked), UI (untracked inherited), C (cached), CI (cached inherited), or TI (transaction inherited)
	 */
	_pk: string;
	// needs to manually stringify snapshot_content
	snapshot_content: string | null;
};

/**
 * Returns a `SelectQueryBuilder` that mirrors the legacy `lix_internal_resolved_state_all`
 * view. Optional cache routing swaps the cache source for a UNION of physical tables,
 * allowing the caller to bypass the virtual cache view.
 *
 * @example
 * ```ts
 * const rows = await selectFromResolvedState({
 * 	cacheRouting: { schemaKeys: ["lix_version_descriptor"] },
 * })
 * 	.where("version_id", "=", "global")
 * 	.selectAll()
 * 	.execute();
 * ```
 */
export function buildResolvedStateQuery(
	options?: ResolvedStateQueryOptions
): SelectQueryBuilder<any, string, ResolvedStateRow> {
	const querySql = buildResolvedStateSql(options);
	const tableExpression = sql<ResolvedStateRow>`(${sql.raw(querySql)})`.as(
		RESOLVED_ALIAS
	);

	return internalQueryBuilder.selectFrom(
		tableExpression
	) as unknown as SelectQueryBuilder<any, string, ResolvedStateRow>;
}
