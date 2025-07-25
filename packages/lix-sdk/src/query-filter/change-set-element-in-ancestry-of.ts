import type { LixCommit } from "../commit/schema.js";
import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters elements that are in the ancestry of the given commit(s).
 *
 * @param target - A target commit object (or its id), or an array of such objects/ids.
 * @param options - Optional options object (e.g., depth limit)
 * @returns A Kysely ExpressionBuilder function for filtering.
 *
 * @example
 * // Elements from the history of commit2 (object)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf(commit2))
 *   .selectAll()
 *
 * // Elements from the history of commit2 (id)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf(commit2.id))
 *   .selectAll()
 *
 * // Elements from the combined history of commit2 and commit4 (divergent branches)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf([commit2, commit4]))
 *   .selectAll()
 */
export function changeSetElementInAncestryOf(
	target: Pick<LixCommit, "id"> | Array<Pick<LixCommit, "id">>,
	options?: { depth?: number }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	const depthLimit = options?.depth;
	const targetsArray = Array.isArray(target) ? target : [target];
	if (targetsArray.length === 0) {
		throw new Error(
			"changeSetElementInAncestryOf requires at least one target commit."
		);
	}
	const targetIds = targetsArray.map((commit) =>
		typeof commit === "object" && commit !== null ? commit.id : commit
	);

	return () =>
		sql<SqlBool>`
      change_set_element.change_set_id IN (
        WITH RECURSIVE ancestor_commits(id, depth) AS (
          -- Start with the target commits
          SELECT id, 0 AS depth FROM "commit" WHERE id IN (${sql.join(targetIds.map((id) => sql.lit(id)))})
          UNION ALL
          -- Recursively find parent commits
          SELECT commit_edge.parent_id, ancestor_commits.depth + 1
          FROM commit_edge
          JOIN ancestor_commits ON commit_edge.child_id = ancestor_commits.id
          ${depthLimit !== undefined ? sql`WHERE ancestor_commits.depth < ${sql.lit(depthLimit)}` : sql``}
        )
        -- Get the change_set_ids from the ancestor commits
        SELECT change_set_id 
        FROM "commit" 
        WHERE id IN (SELECT id FROM ancestor_commits)
      )
    ` as any;
}
