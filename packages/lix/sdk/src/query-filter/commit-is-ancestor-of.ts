import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixCommit } from "../commit/schema-definition.js";

/**
 * Filters commits that are ancestors of the given commit.
 *
 * By default, this is **exclusive**, meaning it returns only commits strictly
 * *before* the provided commit in the graph.
 *
 * Traverses the `commit_edge` graph recursively, starting from the provided commit
 * (or its parents if exclusive), and returns all commits reachable via parent edges.
 *
 * This filter is typically used to scope the graph before applying filters like `changeIsLeaf()`.
 *
 * ⚠️ This filter only defines the traversal scope — it does not filter changes directly.
 *
 * --- Options ---
 * - `includeSelf`: If `true`, includes the starting `commit` in the results. Defaults to `false`.
 * - `depth`: Limits the traversal depth. `depth: 1` selects only immediate parents (if exclusive)
 *   or the starting node and its immediate parents (if inclusive).
 *
 * --- Examples ---
 *
 * @example Selecting strict ancestors (default)
 * ```ts
 * db.selectFrom("commit")
 *   .where(commitIsAncestorOf({ id: "c3" }))
 *   .selectAll()
 * ```
 *
 * @example Selecting inclusive ancestors
 * ```ts
 * db.selectFrom("commit")
 *   .where(commitIsAncestorOf({ id: "c3" }, { includeSelf: true }))
 *   .selectAll()
 * ```
 *
 * @example Combining with commitIsDescendantOf to select commits between two points in time
 * ```ts
 * // Select all commits between startPoint and endPoint (inclusive)
 * db.selectFrom("commit")
 *   .where(commitIsDescendantOf({ id: "startPoint" }))
 *   .where(commitIsAncestorOf({ id: "endPoint" }))
 *   .selectAll()
 * ```
 */
export function commitIsAncestorOf(
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
				WITH RECURSIVE ap(id, depth) AS (
					SELECT id, 0 AS depth FROM "commit" WHERE id = ${sql.lit(commit.id)}
					UNION ALL
					SELECT commit_edge.parent_id, ap.depth + 1
					FROM commit_edge
					JOIN ap ON commit_edge.child_id = ap.id
					${depthLimit !== undefined ? sql`WHERE ap.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				-- Select based on the includeSelf flag
				SELECT id FROM ap ${includeSelf ? sql`` : sql`WHERE depth > 0`}
			)
		` as any;
}
