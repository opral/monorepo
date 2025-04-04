import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filters change sets that are descendants (or the same) as the given change set.
 *
 * Traverses the `change_set_edge` graph recursively, starting from the provided change set,
 * and returns all change sets that are reachable via child edges.
 *
 * This filter can be useful for finding all changes that happened *after* a specific point.
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * ---
 *
 * @example
 * ```ts
 * db.selectFrom("change_set")
 *   .where(changeSetIsDescendantOf({ id: "cs1" }))
 *   .selectAll()
 * ```
 *
 * @example Combining with changeSetIsAncestorOf to select change sets between two points in time
 * ```ts
 * // Select all change sets between startPoint and endPoint (inclusive)
 * db.selectFrom("change_set")
 *   .where(changeSetIsDescendantOf({ id: "startPoint" }))
 *   .where(changeSetIsAncestorOf({ id: "endPoint" }))
 *   .selectAll()
 * ```
 */
export function changeSetIsDescendantOf(
	changeSet: Pick<ChangeSet, "id">,
	options?: { depth?: number }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set">
) => ExpressionWrapper<LixDatabaseSchema, "change_set", SqlBool> {
	const depthLimit = options?.depth;

	return () =>
		sql<SqlBool>`
			change_set.id IN (
				WITH RECURSIVE dp(id, depth) AS (
					SELECT id, 0 AS depth FROM change_set WHERE id = ${sql.lit(changeSet.id)}
					UNION ALL
					SELECT change_set_edge.child_id, dp.depth + 1
					FROM change_set_edge
					JOIN dp ON change_set_edge.parent_id = dp.id -- Join on parent_id to find children
					${depthLimit !== undefined ? sql`WHERE dp.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				SELECT id FROM dp
			)
		` as any;
}
