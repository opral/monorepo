import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters `change_set_element` rows whose associated `change` is the last known definition
 * of a given entity (by `entity_id`, `file_id`, `schema_key`) within the currently
 * selected ancestry of change sets.
 *
 * A change is considered a **leaf** if no other change (in a descendant change set)
 * redefines the same entity.
 *
 * ⚠️ Assumes the current query joins both `change` and `change_set_element`.
 *
 * @example
 * ```ts
 * db.selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where(changeSetElementInAncestryOf(cs))
 *   .where(changeSetElementIsLeaf())
 *   .selectAll()
 * ```
 */
export function changeSetElementIsLeaf(): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change">
) => ExpressionWrapper<LixDatabaseSchema, "change", SqlBool> {
	return () =>
		sql<SqlBool>`
			NOT EXISTS (
				SELECT 1
				FROM change AS newer
				JOIN change_set_element AS newer_cse
					ON newer_cse.change_id = newer.id
				WHERE
					newer.entity_id = change.entity_id
					AND newer.file_id = change.file_id
					AND newer.schema_key = change.schema_key
					AND newer.id != change.id
					AND newer_cse.change_set_id IN (
						SELECT change_set_element.change_set_id
						FROM change_set_element
					)
			)
		` as any;
}
