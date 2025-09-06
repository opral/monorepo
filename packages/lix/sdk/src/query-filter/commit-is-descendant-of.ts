import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixCommit } from "../commit/schema.js";

/**
 * Filters commits that are descendants of the given commit.
 *
 * By default, this is **exclusive**, meaning it returns only commits strictly
 * *after* the provided commit in the graph.
 *
 * Traverses the `commit_edge` graph recursively, starting from the provided commit
 * (or its children if exclusive), and returns all commits reachable via child edges.
 *
 * This filter is useful for finding changes made *after* a specific point in time (e.g., a checkpoint).
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * --- Options ---
 * - `includeSelf`: If `true`, includes the starting `commit` in the results. Defaults to `false`.
 * - `depth`: Limits the traversal depth. `depth: 1` selects only immediate children (if exclusive)
 *   or the starting node and its immediate children (if includeSelf is true).
 *
 * --- Examples ---
 *
 * @example Selecting strict descendants (default)
 * ```ts
 * db.selectFrom("commit")
 *   .where(commitIsDescendantOf({ id: "c1" }))
 *   .selectAll()
 * ```
 *
 * @example Combining with commitIsAncestorOf to select commits between two points in time
 * ```ts
 * // Select all commits between startPoint and endPoint (inclusive)
 * db.selectFrom("commit")
 *   .where(commitIsDescendantOf({ id: "startPoint" }))
 *   .where(commitIsAncestorOf({ id: "endPoint" }))
 *   .selectAll()
 * ```
 */
export function commitIsDescendantOf(
	commit: Pick<LixCommit, "id">,
	options?: { depth?: number; includeSelf?: boolean }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "commit">
) => ExpressionWrapper<LixDatabaseSchema, "commit", SqlBool> {
	const depthLimit = options?.depth;
	const includeSelf = options?.includeSelf ?? false;

	return () =>
		sql<SqlBool>`
			"commit".id IN (
				WITH RECURSIVE dp(id, depth) AS (
					SELECT id, 0 AS depth FROM "commit" WHERE id = ${sql.lit(commit.id)}
					UNION ALL
					SELECT commit_edge.child_id, dp.depth + 1
					FROM commit_edge
					JOIN dp ON commit_edge.parent_id = dp.id
					${depthLimit !== undefined ? sql`WHERE dp.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				-- Select based on the includeSelf flag
				SELECT id FROM dp ${includeSelf ? sql`` : sql`WHERE depth > 0`}
			)
		` as any;
}
