import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";
import { sql, type SelectQueryBuilder } from "kysely";

export type DiffRow = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	before_version_id: string | null;
	before_change_id: string | null;
	before_commit_id: string | null;
	after_version_id: string | null;
	after_change_id: string | null;
	after_commit_id: string | null;
	status: "created" | "updated" | "deleted" | "unchanged" | null;
};

/**
 * Compares two versions and returns differences between their entities.
 *
 * This function is modeled for merging a source version into a target version,
 * which is why the source always wins in conflict scenarios (when both versions 
 * modified the same entity). It performs a full outer join between source and 
 * target versions to identify created, updated, deleted, and unchanged entities.
 *
 * Note: More sophisticated diff strategies and proper conflict handling are 
 * planned for the future. Please upvote https://github.com/opral/lix-sdk/issues/368 
 * if you need conflict detection and resolution capabilities.
 *
 * The returned query builder allows for flexible filtering and composition
 * before executing the diff. When no target is specified, compares against
 * the active version.
 *
 * Diff status meanings:
 * - `created`: Entity exists only in source version (new addition)
 * - `deleted`: Entity explicitly deleted in source (tombstone present)
 * - `updated`: Entity exists in both but with different change_ids (source wins)
 * - `unchanged`: Entity has same change_id in both OR exists only in target without explicit deletion
 *
 * Visual representation (source → target):
 * ```
 * Status      | Source | Target | before_version_id | after_version_id | before_* | after_*
 * ------------|--------|--------|-------------------|------------------|----------|----------
 * created     |   ✓    |   ✗    |       null        |    source.id     |   null   | source
 * deleted     |   ✓*   |   ✓    |     target.id     |    source.id     |  target  | tombstone
 * updated     |   ✓    |   ✓    |     target.id     |    source.id     |  target  | source
 * unchanged   |   ✓    |   ✓    |     target.id     |    source.id     |   same   | same
 * unchanged   |   ✗    |   ✓    |     target.id     |     target.id    |  target  | target
 * ```
 * * Source ✓* indicates a tombstone (explicit deletion)
 *
 * Performance tips:
 * - Filter by status to exclude unchanged entities (most common)
 * - Filter by file_id when diffing specific documents
 * - Filter by schema_key when interested in specific entity types
 *
 * @example
 * // Get all changes between two versions
 * const changes = await selectVersionDiff({ lix, source, target })
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 *
 * @example
 * // Compare specific file between source and active version
 * const fileDiff = await selectVersionDiff({ lix, source })
 *   .where('diff.file_id', '=', 'file1.json')
 *   .where('diff.status', '!=', 'unchanged')
 *   .orderBy('diff.entity_id')
 *   .execute();
 *
 * @example
 * // Get only entities of a specific schema that were modified
 * const schemaDiff = await selectVersionDiff({ lix, source, target })
 *   .where('diff.schema_key', '=', 'message')
 *   .where('diff.status', 'in', ['created', 'updated', 'deleted'])
 *   .execute();
 *
 * @example
 * // Find entities that exist only in target (no explicit delete in source)
 * const targetOnly = await selectVersionDiff({ lix, source, target })
 *   .where('diff.status', '=', 'unchanged')
 *   .whereRef('diff.after_version_id', '=', 'diff.before_version_id')
 *   .execute();
 *
 * @example
 * // Check if specific entities changed
 * const entityDiff = await selectVersionDiff({ lix, source, target })
 *   .where('diff.entity_id', 'in', ['entity1', 'entity2', 'entity3'])
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 *
 * if (entityDiff.length > 0) {
 *   // Some entities changed
 * }
 *
 * ## Understanding Common Ancestor Behavior
 *
 * Imagine you and a colleague both start from the same document (common ancestor):
 * - You create a "source" version and make changes
 * - Your colleague creates a "target" version and makes different changes
 *
 * When comparing these versions, the diff needs to know:
 * 1. What did YOU intentionally delete? (will be removed from target)
 * 2. What did your colleague add that you never knew about? (will be kept)
 *
 * The system tracks deletions using "tombstones" - special markers that say 
 * "this entity was deleted". When you delete something, a tombstone is created.
 *
 * This means:
 * - If you deleted "entity A" that existed in the common ancestor → 
 *   Status: "deleted" (tombstone present, will be removed from target)
 * - If "entity B" only exists in target (added after you created your version) → 
 *   Status: "unchanged" (no tombstone, you never knew about it, so it stays)
 *
 * Without this logic, the system couldn't tell the difference between 
 * "I deleted this" and "I never had this".
 */
export function selectVersionDiff(args: {
	lix: Lix;
	source: Pick<LixVersion, "id">;
	target?: Pick<LixVersion, "id">;
}): SelectQueryBuilder<any, "diff", DiffRow> {
	const db = args.lix.db;

	const sourceVersionId = sql.lit(args.source.id);
	const targetVersionId = args.target
		? sql.lit(args.target.id)
		: sql`(SELECT version_id FROM active_version)`;

	const sub = sql<DiffRow>`
WITH
  -- Source side should expose explicit deletions (tombstones)
  -- Use state_with_tombstones to include rows with NULL snapshot_content
  s AS (
    SELECT entity_id, schema_key, file_id, change_id, commit_id, version_id, snapshot_content
    FROM state_with_tombstones
    WHERE version_id = ${sourceVersionId}
  ),
  t AS (
    SELECT entity_id, schema_key, file_id, change_id, commit_id, version_id
    FROM state_all
    WHERE version_id = ${targetVersionId}
  ),
  joined AS (
    SELECT
      COALESCE(s.entity_id, t.entity_id) AS entity_id,
      COALESCE(s.schema_key, t.schema_key) AS schema_key,
      COALESCE(s.file_id, t.file_id) AS file_id,
      t.version_id AS before_version_id,
      t.change_id AS before_change_id,
      t.commit_id AS before_commit_id,
      s.version_id AS after_version_id,
      s.change_id AS after_change_id,
      s.commit_id AS after_commit_id,
      CASE
        -- Explicit delete in source (tombstone takes precedence)
        WHEN s.change_id IS NOT NULL AND s.snapshot_content IS NULL THEN 'deleted'
        -- Created in source only (live row)
        WHEN s.change_id IS NOT NULL AND t.change_id IS NULL AND s.snapshot_content IS NOT NULL THEN 'created'
        -- Both present and different (live row in source)
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.snapshot_content IS NOT NULL AND s.change_id != t.change_id THEN 'updated'
        -- Both present and same (live row in source)
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.snapshot_content IS NOT NULL AND s.change_id = t.change_id THEN 'unchanged'
        ELSE NULL
      END AS status
    FROM s
    LEFT JOIN t ON t.entity_id = s.entity_id AND t.schema_key = s.schema_key AND t.file_id = s.file_id
    UNION ALL
    SELECT
      COALESCE(s.entity_id, t.entity_id) AS entity_id,
      COALESCE(s.schema_key, t.schema_key) AS schema_key,
      COALESCE(s.file_id, t.file_id) AS file_id,
      t.version_id AS before_version_id,
      t.change_id AS before_change_id,
      t.commit_id AS before_commit_id,
      -- For target-only rows (no source contribution), mirror target values for after_*
      -- This represents entities that exist in target but were never in source
      t.version_id AS after_version_id,
      t.change_id AS after_change_id,
      t.commit_id AS after_commit_id,
      CASE
        -- Target-only: entity exists in target but never existed in source (no explicit delete)
        -- Treated as unchanged since source doesn't modify it
        WHEN s.change_id IS NULL AND t.change_id IS NOT NULL THEN 'unchanged'
        -- These branches shouldn't occur in this half because s.change_id IS NULL filter is applied
        WHEN s.change_id IS NOT NULL AND t.change_id IS NULL THEN 'created'
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.change_id != t.change_id THEN 'updated'
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.change_id = t.change_id THEN 'unchanged'
        ELSE NULL
      END AS status
    FROM t
    LEFT JOIN s ON s.entity_id = t.entity_id AND s.schema_key = t.schema_key AND s.file_id = t.file_id
    WHERE s.change_id IS NULL
  )
SELECT *
FROM joined
    `;

	const aliased = sql`(${sub})`.as("diff");
	const qb = db
		.selectFrom(aliased)
		.selectAll() as unknown as SelectQueryBuilder<any, "diff", DiffRow>;
	return qb;
}
