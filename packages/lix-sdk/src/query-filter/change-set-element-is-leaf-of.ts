import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filters `change_set_element` rows that represent the last known definition
 * of a given entity (by `entity_id`, `file_id`, `schema_key`) at a specific point in time,
 * defined by the target change set.
 *
 * A change set element is considered a **leaf at point** if no other element in the ancestry 
 * of the target change set redefines the same entity.
 *
 * This is particularly useful for restore operations where we want to get the state
 * at a specific point in time, ignoring any changes that came after.
 *
 * @example
 * ```ts
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementInAncestryOf(cs))
 *   .where(changeSetElementIsLeafOf(cs))
 *   .selectAll()
 * ```
 */
export function changeSetElementIsLeafOf(
	targetChangeSet: Pick<ChangeSet, "id">
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	return () =>
		sql<SqlBool>`
			NOT EXISTS (
				-- Ancestry: All change sets from targetChangeSet upwards
				WITH RECURSIVE ancestry(id) AS (
					-- Start with the target change set
					SELECT ${sql.lit(targetChangeSet.id)}
					
					UNION ALL
					
					-- Recursively find all ancestors
					SELECT cse.parent_id
					FROM change_set_edge cse
					JOIN ancestry a ON cse.child_id = a.id
				),
				-- Descendants: All change sets from the current change's change set downwards
				descendants(id) AS (
					SELECT change_set_element.change_set_id

					UNION ALL

					SELECT cse.child_id
					FROM change_set_edge cse
					JOIN descendants d ON cse.parent_id = d.id
				)
				SELECT 1
				FROM change_set_element AS newer_cse
				WHERE
					newer_cse.entity_id = change_set_element.entity_id
					AND newer_cse.file_id = change_set_element.file_id
					AND newer_cse.schema_key = change_set_element.schema_key
					AND (newer_cse.change_set_id != change_set_element.change_set_id 
					     OR newer_cse.change_id != change_set_element.change_id)
					-- Newer change must be in the ancestry of the target change set
					AND newer_cse.change_set_id IN (SELECT id FROM ancestry)
					-- Newer change's change set must be a descendant of (or same as) the current change's change set
					AND newer_cse.change_set_id IN (SELECT id FROM descendants)
			)
		` as any;
}
