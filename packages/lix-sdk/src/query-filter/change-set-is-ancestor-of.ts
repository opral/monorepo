import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filters change sets that are ancestors (or the same) as the given change set.
 *
 * Traverses the `change_set_edge` graph recursively, starting from the provided change set,
 * and returns all change sets that are reachable via parent edges.
 *
 * This filter is typically used to scope the graph before applying filters like `changeIsLeaf()`.
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * ---
 *
 * @example
 * ```ts
 * db.selectFrom("change_set")
 *   .where(changeSetIsAncestorOf({ id: "cs3" }))
 *   .selectAll()
 * ```
 *
 * @example
 * ```ts
 * db.selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .innerJoin("change_set", "change_set.id", "change_set_element.change_set_id")
 *   .where(changeSetIsAncestorOf({ id: "cs3" }))
 *   .where(changeIsLeaf())
 *   .selectAll()
 * ```
 * 
 * @example Combining with changeSetIsDescendantOf to select change sets between two points in time
 * ```ts
 * // Select all change sets between startPoint and endPoint (inclusive)
 * db.selectFrom("change_set")
 *   .where(changeSetIsDescendantOf({ id: "startPoint" }))
 *   .where(changeSetIsAncestorOf({ id: "endPoint" }))
 *   .selectAll()
 * ```
 */
export function changeSetIsAncestorOf(
	changeSet: Pick<ChangeSet, "id">,
	options?: { depth?: number }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set">
) => ExpressionWrapper<LixDatabaseSchema, "change_set", SqlBool> {
	const depthLimit = options?.depth;

	return () =>
		sql<SqlBool>`
			change_set.id IN (
				WITH RECURSIVE ap(id, depth) AS (
					SELECT id, 0 AS depth FROM change_set WHERE id = ${sql.lit(changeSet.id)}
					UNION ALL
					SELECT change_set_edge.parent_id, ap.depth + 1
					FROM change_set_edge
					JOIN ap ON change_set_edge.child_id = ap.id
					${depthLimit !== undefined ? sql`WHERE ap.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				-- Select only IDs with depth > 0 to exclude the starting node itself
				SELECT id FROM ap WHERE depth > 0
			)
		` as any;
}
