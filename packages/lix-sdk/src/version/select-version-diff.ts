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
 * - `created`: Entity exists only in source version
 * - `deleted`: Entity exists only in target version  
 * - `updated`: Entity exists in both but with different change_ids (source wins)
 * - `unchanged`: Entity exists in both with identical change_ids
 *
 * Visual representation (source → target):
 * ```
 * Status      | Source | Target | before_version_id | after_version_id | before_* | after_*
 * ------------|--------|--------|-------------------|------------------|----------|----------
 * created     |   ✓    |   ✗    |       null        |    source.id     |   null   | source
 * deleted     |   ✗    |   ✓    |     target.id     |       null       |  target  | null
 * updated     |   ✓    |   ✓    |     target.id     |    source.id     |  target  | source
 * unchanged   |   ✓    |   ✓    |     target.id     |    source.id     |   same   | same
 * ```
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
 * // Check if specific entities changed
 * const entityDiff = await selectVersionDiff({ lix, source, target })
 *   .where('diff.entity_id', 'in', ['entity1', 'entity2', 'entity3'])
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 *
 * if (entityDiff.length > 0) {
 *   // Some entities changed
 * }
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
  s AS (
    SELECT entity_id, schema_key, file_id, change_id, commit_id, version_id
    FROM state_all
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
        WHEN s.change_id IS NOT NULL AND t.change_id IS NULL THEN 'created'
        WHEN s.change_id IS NULL AND t.change_id IS NOT NULL THEN 'deleted'
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.change_id != t.change_id THEN 'updated'
        WHEN s.change_id IS NOT NULL AND t.change_id IS NOT NULL AND s.change_id = t.change_id THEN 'unchanged'
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
      s.version_id AS after_version_id,
      s.change_id AS after_change_id,
      s.commit_id AS after_commit_id,
      CASE
        WHEN s.change_id IS NOT NULL AND t.change_id IS NULL THEN 'created'
        WHEN s.change_id IS NULL AND t.change_id IS NOT NULL THEN 'deleted'
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
