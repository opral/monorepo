import type { ChangeSet } from "../change-set/schema.js";
import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters elements that are in the ancestry of the given change set(s).
 *
 * @param target - A target change set object (or its id), or an array of such objects/ids.
 * @param options - Optional options object (e.g., depth limit)
 * @returns A Kysely ExpressionBuilder function for filtering.
 *
 * @example
 * // Elements from the history of cs2 (object)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf(cs2))
 *   .selectAll()
 *
 * // Elements from the history of cs2 (id)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf(cs2.id))
 *   .selectAll()
 *
 * // Elements from the combined history of cs2 and cs4 (divergent branches)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf([cs2, cs4]))
 *   .selectAll()
 */
export function changeSetElementInAncestryOf(
	target: Pick<ChangeSet, "id"> | Array<Pick<ChangeSet, "id">>,
	options?: { depth?: number }
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	const depthLimit = options?.depth;
	const targetsArray = Array.isArray(target) ? target : [target];
	if (targetsArray.length === 0) {
		throw new Error(
			"changeSetElementInAncestryOf requires at least one target change set."
		);
	}
	const targetIds = targetsArray.map((cs) =>
		typeof cs === "object" && cs !== null ? cs.id : cs
	);

	return () =>
		sql<SqlBool>`
      change_set_element.change_set_id IN (
        WITH RECURSIVE ancestors(id, depth) AS (
          SELECT id, 0 AS depth FROM change_set WHERE id IN (${sql.join(targetIds.map((id) => sql.lit(id)))})
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
