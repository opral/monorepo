import type { ChangeSet } from "../change-set/database-schema.js";
import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters the leaves of the given change set(s).
 *
 * An element is considered a **leaf** if no other element in the combined ancestry
 * of the target change sets redefines the same entity at a later point in the graph.
 *
 * @param target - A target change set object (or its id), or an array of such objects/ids.
 *
 * @example
 * // Find leaves relative to a single change set (object)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf(cs))
 *   .selectAll()
 *
 * // Find leaves relative to a single change set (id)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf(cs.id))
 *   .selectAll()
 *
 * // Find leaves relative to multiple change sets
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf([cs_source, cs_target]))
 *   .selectAll()
 */
export function changeSetElementIsLeafOf(
	target: Pick<ChangeSet, "id"> | Array<Pick<ChangeSet, "id">>
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	// Normalize to array
	const targetsArray = Array.isArray(target) ? target : [target];
	if (targetsArray.length === 0) {
		throw new Error(
			"changeSetElementIsLeafOf requires at least one targetChangeSet."
		);
	}

	// Convert to ids if needed
	const ids = targetsArray.map((cs) =>
		typeof cs === "object" && cs !== null ? cs.id : cs
	);

	// Generate SELECT statements for each target head for UNION ALL
	const changeSetIds = ids
		.map((id) => sql`SELECT ${sql.lit(id)} as id`)
		.reduce((acc, curr) => (acc ? sql`${acc} UNION ALL ${curr}` : curr));

	return () =>
		sql<SqlBool>`
      -- Element must exist within the combined ancestry
      change_set_element.change_set_id IN (
        WITH RECURSIVE combined_ancestry(id) AS (
          ${changeSetIds}
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
          ${changeSetIds}
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
