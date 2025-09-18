import type { Lix } from "../lix/open-lix.js";
import { sql, type SelectQueryBuilder } from "kysely";
import type { DiffRow } from "../version/select-version-diff.js";

/**
 * Compare two commits and return differences between their leaf entity states.
 *
 * Reconstructs entity states at each commit by walking commit ancestry, then compares them.
 * Unlike version-based diffs, this dynamically computes states without requiring version materialization.
 *
 * Diff status meanings:
 *
 * - `added`: Entity exists only in `after` commit
 * - `removed`: Entity exists only in `before` commit
 * - `modified`: Entity exists in both with different change_ids
 * - `unchanged`: Entity exists in both with same change_id
 *
 * Uses fast-path optimization when `includeUnchanged: false` (default) by first identifying
 * changed entity triples, then only reconstructing leaf states for those.
 *
 * The `hints` parameter filters results at the database level for better performance:
 *
 * - `includeUnchanged`: Include unchanged entities (default: true). Set false for fast-path optimization.
 * - `fileId`: Limit to specific file
 * - `pluginKey`: Filter by plugin that created changes
 * - `schemaKeys`: Include only specific entity types
 * - `entityIds`: Include only specific entities
 *
 * @example
 * // Get changes between commits
 * const changes = await selectCommitDiff({
 *   lix,
 *   before: 'abc123',
 *   after: 'xyz789',
 *   hints: { includeUnchanged: false }
 * }).execute();
 *
 * @example
 * // Filter by file and status
 * const fileDiff = await selectCommitDiff({ lix, before, after })
 *   .where('diff.file_id', '=', 'messages.json')
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 */
export function selectCommitDiff(args: {
	lix: Lix;
	before: string;
	after: string;
	hints?: {
		includeUnchanged?: boolean;
		fileId?: string;
		pluginKey?: string;
		schemaKeys?: string[];
		entityIds?: string[];
	};
}): SelectQueryBuilder<any, "diff", DiffRow> {
	const db = args.lix.db;
	const hints = args.hints ?? {};
	const includeUnchanged = hints.includeUnchanged !== false; // default true

	// Leaf-at-commit helper anchored to a specific commit's ancestry.
	// Picks nearest ancestor by depth, breaking ties by newest created_at.
	// Filters tombstones (snapshot_id = 'no-content').
	const leafAt = (commitId: string, useChangedTriples: boolean) => sql`
    WITH RECURSIVE
      anc(id, depth) AS (
        SELECT ${sql.lit(commitId)}, 0
        UNION ALL
        SELECT ce.parent_id, anc.depth + 1
        FROM commit_edge_all ce
        JOIN anc ON ce.child_id = anc.id
        WHERE ce.lixcol_version_id = 'global'
      ),
      changes AS (
        SELECT
          cse.entity_id,
          cse.schema_key,
          cse.file_id,
          ic.id          AS change_id,
          c.id           AS commit_id,
          anc.depth      AS depth,
          ic.created_at  AS created_at,
          ic.snapshot_id AS snapshot_id
        FROM anc
        JOIN commit_all c
          ON c.id = anc.id AND c.lixcol_version_id = 'global'
        JOIN change_set_element_all cse
          ON c.change_set_id = cse.change_set_id
         AND cse.lixcol_version_id = 'global'
        ${useChangedTriples ? sql`JOIN changed_triples ck ON ck.entity_id = cse.entity_id AND ck.schema_key = cse.schema_key AND ck.file_id = cse.file_id` : sql``}
        JOIN internal_change ic
          ON ic.id = cse.change_id
        ${hints.fileId ? sql`AND cse.file_id = ${sql.lit(hints.fileId)}` : sql``}
        ${hints.pluginKey ? sql`AND ic.plugin_key = ${sql.lit(hints.pluginKey)}` : sql``}
        ${hints.schemaKeys && hints.schemaKeys.length ? sql`AND cse.schema_key IN (${sql.join(hints.schemaKeys.map((k) => sql.lit(k)))})` : sql``}
        ${hints.entityIds && hints.entityIds.length ? sql`AND cse.entity_id IN (${sql.join(hints.entityIds.map((k) => sql.lit(k)))})` : sql``}
      ),
      ranked AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY entity_id, schema_key, file_id
                 ORDER BY depth ASC, created_at DESC, change_id DESC
                ) AS rn
        FROM changes
      )
    SELECT entity_id, schema_key, file_id, change_id, commit_id
    FROM ranked
    WHERE rn = 1 AND snapshot_id <> 'no-content'
  `;

	// Fast path: compute changed-only set between commits and fetch leaves just for those triples.
	const subChangedOnly = sql<DiffRow>`
WITH RECURSIVE
  anc_after(id, depth) AS (
    SELECT ${sql.lit(args.after)}, 0
    UNION ALL
    SELECT ce.parent_id, anc_after.depth + 1
    FROM commit_edge_all ce
    JOIN anc_after ON ce.child_id = anc_after.id
    WHERE ce.lixcol_version_id = 'global' AND anc_after.id != ${sql.lit(args.before)}
  ),
  changed_triples AS (
    SELECT DISTINCT cse.entity_id, cse.schema_key, cse.file_id
    FROM anc_after a
    JOIN commit_all c ON c.id = a.id AND c.lixcol_version_id = 'global'
    JOIN change_set_element_all cse ON cse.change_set_id = c.change_set_id AND cse.lixcol_version_id = 'global'
    ${hints.pluginKey ? sql`JOIN internal_change ic ON ic.id = cse.change_id AND ic.plugin_key = ${sql.lit(hints.pluginKey)}` : sql``}
    ${hints.fileId ? sql`WHERE cse.file_id = ${sql.lit(hints.fileId)}` : sql``}
    ${hints.schemaKeys && hints.schemaKeys.length ? sql`${hints.fileId ? sql`AND` : sql`WHERE`} cse.schema_key IN (${sql.join(hints.schemaKeys.map((k) => sql.lit(k)))})` : sql``}
    ${hints.entityIds && hints.entityIds.length ? sql`${hints.fileId || (hints.schemaKeys && hints.schemaKeys.length) ? sql`AND` : sql`WHERE`} cse.entity_id IN (${sql.join(hints.entityIds.map((k) => sql.lit(k)))})` : sql``}
  ),
  b AS (
    SELECT * FROM (${leafAt(args.before, true)}) lb
    JOIN changed_triples ck ON ck.entity_id = lb.entity_id AND ck.schema_key = lb.schema_key AND ck.file_id = lb.file_id
  ),
  a AS (
    SELECT * FROM (${leafAt(args.after, true)}) la
    JOIN changed_triples ck ON ck.entity_id = la.entity_id AND ck.schema_key = la.schema_key AND ck.file_id = la.file_id
  ),
  joined AS (
    SELECT
      a.entity_id AS entity_id,
      a.schema_key AS schema_key,
      a.file_id AS file_id,
      NULL AS before_version_id,
      b.change_id AS before_change_id,
      b.commit_id AS before_commit_id,
      NULL AS after_version_id,
      a.change_id AS after_change_id,
      a.commit_id AS after_commit_id,
      CASE
        WHEN b.change_id IS NULL THEN 'added'
        WHEN a.change_id != b.change_id THEN 'modified'
        ELSE 'unchanged'
      END AS status
    FROM a
    LEFT JOIN b ON (
      b.entity_id = a.entity_id AND b.schema_key = a.schema_key AND b.file_id = a.file_id
    )
    UNION ALL
    SELECT
      b.entity_id AS entity_id,
      b.schema_key AS schema_key,
      b.file_id AS file_id,
      NULL AS before_version_id,
      b.change_id AS before_change_id,
      b.commit_id AS before_commit_id,
      NULL AS after_version_id,
      NULL AS after_change_id,
      NULL AS after_commit_id,
      'removed' AS status
    FROM b
    LEFT JOIN a ON (
      a.entity_id = b.entity_id AND a.schema_key = b.schema_key AND a.file_id = b.file_id
    )
    WHERE a.change_id IS NULL
  )
SELECT * FROM joined WHERE status != 'unchanged'
  `;

	const subFull = sql<DiffRow>`
WITH
  b AS (${leafAt(args.before, false)}),
  a AS (${leafAt(args.after, false)}),
  joined AS (
    SELECT
      a.entity_id AS entity_id,
      a.schema_key AS schema_key,
      a.file_id AS file_id,
      NULL AS before_version_id,
      b.change_id AS before_change_id,
      b.commit_id AS before_commit_id,
      NULL AS after_version_id,
      a.change_id AS after_change_id,
      a.commit_id AS after_commit_id,
      CASE
        WHEN b.change_id IS NULL THEN 'added'
        WHEN a.change_id != b.change_id THEN 'modified'
        ELSE 'unchanged'
      END AS status
    FROM a
    LEFT JOIN b ON (
      b.entity_id = a.entity_id AND b.schema_key = a.schema_key AND b.file_id = a.file_id
    )
    UNION ALL
    SELECT
      b.entity_id AS entity_id,
      b.schema_key AS schema_key,
      b.file_id AS file_id,
      NULL AS before_version_id,
      b.change_id AS before_change_id,
      b.commit_id AS before_commit_id,
      NULL AS after_version_id,
      NULL AS after_change_id,
      NULL AS after_commit_id,
      'removed' AS status
    FROM b
    LEFT JOIN a ON (
      a.entity_id = b.entity_id AND a.schema_key = b.schema_key AND a.file_id = b.file_id
    )
    WHERE a.change_id IS NULL
  )
SELECT * FROM joined
  `;

	const sub = includeUnchanged ? subFull : subChangedOnly;

	const aliased = sql`(${sub})`.as("diff");
	return db.selectFrom(aliased).selectAll() as unknown as SelectQueryBuilder<
		any,
		"diff",
		DiffRow
	>;
}
