import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filters change sets that are ancestors of the given change set.
 *
 * By default, this is **exclusive**, meaning it returns only change sets strictly
 * *before* the provided change set in the graph.
 *
 * Traverses the `change_set_edge` graph recursively, starting from the provided change set
 * (or its parents if exclusive), and returns all change sets reachable via parent edges.
 *
 * This filter is typically used to scope the graph before applying filters like `changeIsLeaf()`.
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * --- Options --- 
 * - `inclusive`: If `true`, includes the starting `changeSet` in the results. Defaults to `false`.
 * - `depth`: Limits the traversal depth. `depth: 1` selects only immediate parents (if exclusive) 
 *   or the starting node and its immediate parents (if inclusive).
 *
 * --- Examples --- 
 *
 * @example Selecting strict ancestors (default)
 * ```ts
 * db.selectFrom("change_set")
 *   .where(changeSetIsAncestorOf({ id: "cs3" }))
 *   .selectAll()
 * ```
 *
 * @example Selecting inclusive ancestors
 * ```ts
 * db.selectFrom("change_set")
 *   .where(changeSetIsAncestorOf({ id: "cs3" }, { inclusive: true }))
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
	options?: { depth?: number; inclusive?: boolean }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set">
) => ExpressionWrapper<LixDatabaseSchema, "change_set", SqlBool> {
	const depthLimit = options?.depth;
	const inclusive = options?.inclusive ?? false;

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
				-- Select based on the inclusive flag
				SELECT id FROM ap ${inclusive ? sql`` : sql`WHERE depth > 0`}
			)
		` as any;
}
