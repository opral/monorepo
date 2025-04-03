import {
	sql,
	type SqlBool,
	type ExpressionBuilder,
	type ExpressionWrapper,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filters `change_set_element` rows whose `change_set_id` is in the ancestry
 * (or is the same as) any of the given target change sets.
 *
 * This is used to select all change set elements that belong to the combined graph
 * defined by the target change sets and their parent traversals via `change_set_edge`.
 *
 * ⚠️ This filter operates on `change_set_element` rows.
 *
 * @example
 * ```ts
 * // Elements from the history of cs2
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf([cs2]))
 *   .selectAll()
 *
 * // Elements from the combined history of cs2 and cs4 (divergent branches)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf([cs2, cs4]))
 *   .selectAll()
 * ```
 */
export function changeSetElementInAncestryOf(
	changeSets: Pick<ChangeSet, "id">[],
	options?: { depth?: number }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	const depthLimit = options?.depth;
	const targetIds = changeSets.map((cs) => cs.id);

	return () =>
		sql<SqlBool>`
			change_set_element.change_set_id IN (
				WITH RECURSIVE ancestors(id, depth) AS (
					SELECT id, 0 AS depth FROM change_set WHERE id IN (${sql.join(targetIds.map(id => sql.lit(id)))})
					UNION ALL
					SELECT change_set_edge.parent_id, ancestors.depth + 1
					FROM change_set_edge
					JOIN ancestors ON change_set_edge.child_id = ancestors.id
					${depthLimit !== undefined ? sql`WHERE ancestors.depth < ${sql.lit(depthLimit)}` : sql``}
				)
				SELECT id FROM ancestors
			)
		` as any;
}
