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
 * of a given entity (by `entity_id`, `file_id`, `schema_key`) relative to the combined history
 * of one or more target change sets.
 *
 * An element is considered a **leaf** if no other element in the combined ancestry
 * of the target change sets redefines the same entity at a later point in the graph.
 *
 * @param targetChangeSets - An array of target change set objects (or just their IDs).
 * @returns A Kysely ExpressionBuilder function for filtering.
 *
 * @example
 * // Find leaves relative to a single change set
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf([cs]))
 *   .selectAll()
 *
 * // Find leaves relative to the combined history of two change sets (useful for merge)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf([cs_source, cs_target]))
 *   .selectAll()
 */
export function changeSetElementIsLeafOf(
	targetChangeSets: Pick<ChangeSet, "id">[]
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	// Ensure we have at least one target change set
	if (targetChangeSets.length === 0) {
		throw new Error(
			"changeSetElementIsLeafOf requires at least one targetChangeSet."
		);
	}

	// Generate SELECT statements for each target head for UNION ALL
	const headSelects = targetChangeSets
		.map((cs) => sql`SELECT ${sql.lit(cs.id)} as id`)
		.reduce((acc, curr) => (acc ? sql`${acc} UNION ALL ${curr}` : curr));

	return () =>
		sql<SqlBool>`
			-- Element must exist within the combined ancestry
			change_set_element.change_set_id IN (
				WITH RECURSIVE combined_ancestry(id) AS (
					${headSelects}
					UNION -- Use UNION here to combine heads with recursive parent lookup (deduplicates)
					SELECT cse.parent_id
					FROM change_set_edge cse
					JOIN combined_ancestry a ON cse.child_id = a.id
					WHERE cse.parent_id IS NOT NULL
				)
				SELECT id FROM combined_ancestry
			)
			AND
			-- And it must be a leaf within that combined ancestry
			NOT EXISTS (
				WITH RECURSIVE
				-- Combined Ancestry: All change sets from ALL targetChangeSets upwards
				combined_ancestry(id) AS (
					${headSelects}
					UNION -- Use UNION here to combine heads with recursive parent lookup (deduplicates)
					SELECT cse.parent_id
					FROM change_set_edge cse
					JOIN combined_ancestry a ON cse.child_id = a.id
					WHERE cse.parent_id IS NOT NULL
				),
				-- Descendants: All change sets from the current element's change set downwards
				-- (relative to the element being checked, NOT the target heads)
				descendants(id) AS (
					SELECT change_set_element.change_set_id
					UNION ALL
					SELECT cse.child_id
					FROM change_set_edge cse
					JOIN descendants d ON cse.parent_id = d.id
				)
				-- Check for a newer element defining the same entity
				SELECT 1
				FROM change_set_element AS newer_cse
				WHERE
					-- Same entity definition
					newer_cse.entity_id = change_set_element.entity_id
					AND newer_cse.file_id = change_set_element.file_id
					AND newer_cse.schema_key = change_set_element.schema_key
					-- Different element instance
					AND (newer_cse.change_set_id != change_set_element.change_set_id 
					     OR newer_cse.change_id != change_set_element.change_id)
					-- Newer element must be in the combined ancestry of the target change sets
					AND newer_cse.change_set_id IN (SELECT id FROM combined_ancestry)
					-- Newer element's change set must be a descendant of the current element's change set
					AND newer_cse.change_set_id IN (SELECT id FROM descendants)
			)
		` as any;
}
