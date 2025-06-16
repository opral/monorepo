import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/schema.js";

/**
 * Filters change sets that are descendants of the given change set.
 *
 * By default, this is **exclusive**, meaning it returns only change sets strictly
 * *after* the provided change set in the graph.
 *
 * Traverses the `change_set_edge` graph recursively, starting from the provided change set
 * (or its children if exclusive), and returns all change sets reachable via child edges.
 *
 * This filter is useful for finding changes made *after* a specific point in time (e.g., a checkpoint).
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * --- Options ---
 * - `includeSelf`: If `true`, includes the starting `changeSet` in the results. Defaults to `false`.
 * - `depth`: Limits the traversal depth. `depth: 1` selects only immediate children (if exclusive)
 *   or the starting node and its immediate children (if includeSelf is true).
 *
 * --- Examples ---
 *
 * @example Selecting strict descendants (default)
 * ```ts
 * db.selectFrom("change_set_all")
 *   .where(changeSetIsDescendantOf({ id: "cs1" }))
 *   .selectAll()
 * ```
 *
 * @example Combining with changeSetIsAncestorOf to select change sets between two points in time
 * ```ts
 * // Select all change sets between startPoint and endPoint (inclusive)
 * db.selectFrom("change_set_all")
 *   .where(changeSetIsDescendantOf({ id: "startPoint" }))
 *   .where(changeSetIsAncestorOf({ id: "endPoint" }))
 *   .selectAll()
 * ```
 */
export function changeSetIsDescendantOf(
	changeSet: Pick<ChangeSet, "id">,
	options?: { depth?: number; includeSelf?: boolean }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_all">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_all", SqlBool> {
	const depthLimit = options?.depth;
	const includeSelf = options?.includeSelf ?? false;

	return () =>
		sql<SqlBool>`
			change_set_all.id IN (
				WITH RECURSIVE dp(id, depth) AS (
					SELECT id, 0 AS depth FROM change_set_all WHERE id = ${sql.lit(changeSet.id)}
					UNION ALL
					SELECT change_set_edge_all.child_id, dp.depth + 1
					FROM change_set_edge_all
					JOIN dp ON change_set_edge_all.parent_id = dp.id
					${depthLimit !== undefined ? sql`WHERE dp.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				-- Select based on the includeSelf flag
				SELECT id FROM dp ${includeSelf ? sql`` : sql`WHERE depth > 0`}
			)
		` as any;
}
