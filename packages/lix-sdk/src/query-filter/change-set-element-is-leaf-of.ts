import type { LixCommit } from "../commit/schema.js";
import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters the leaves of the given commit(s).
 *
 * An element is considered a **leaf** if no other element in the combined ancestry
 * of the target commits redefines the same entity at a later point in the graph.
 *
 * @param target - A target commit object (or its id), or an array of such objects/ids.
 *
 * @example
 * // Find leaves relative to a single commit (object)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf(commit))
 *   .selectAll()
 *
 * // Find leaves relative to a single commit (id)
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf(commit.id))
 *   .selectAll()
 *
 * // Find leaves relative to multiple commits
 * db.selectFrom("change_set_element")
 *   .where(changeSetElementIsLeafOf([commit_source, commit_target]))
 *   .selectAll()
 */
export function changeSetElementIsLeafOf(
	target: Pick<LixCommit, "id"> | Array<Pick<LixCommit, "id">>
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	// Normalize to array
	const targetsArray = Array.isArray(target) ? target : [target];
	if (targetsArray.length === 0) {
		throw new Error(
			"changeSetElementIsLeafOf requires at least one target commit."
		);
	}

	// Convert to ids if needed
	const ids = targetsArray.map((commit) =>
		typeof commit === "object" && commit !== null ? commit.id : commit
	);

	// Generate SELECT statements for each target head for UNION ALL
	const commitIds = ids
		.map((id) => sql`SELECT ${sql.lit(id)} as id`)
		.reduce((acc, curr) => (acc ? sql`${acc} UNION ALL ${curr}` : curr));

	return () =>
		sql<SqlBool>`
      -- Element must exist within the combined ancestry
      change_set_element.change_set_id IN (
        WITH RECURSIVE 
        -- First get all ancestor commits
        combined_ancestry_commits(id) AS (
          ${commitIds}
          UNION -- Use UNION here to combine heads with recursive parent lookup (deduplicates)
          SELECT ce.parent_id
          FROM commit_edge ce
          JOIN combined_ancestry_commits a ON ce.child_id = a.id
          WHERE ce.parent_id IS NOT NULL
        )
        -- Then get the change_set_ids from those commits
        SELECT change_set_id 
        FROM "commit" 
        WHERE id IN (SELECT id FROM combined_ancestry_commits)
      )
      AND
      -- And it must be a leaf within that combined ancestry
      NOT EXISTS (
        WITH RECURSIVE
        -- Combined Ancestry: All commits from ALL target commits upwards
        combined_ancestry_commits(id) AS (
          ${commitIds}
          UNION -- Use UNION here to combine heads with recursive parent lookup (deduplicates)
          SELECT ce.parent_id
          FROM commit_edge ce
          JOIN combined_ancestry_commits a ON ce.child_id = a.id
          WHERE ce.parent_id IS NOT NULL
        ),
        -- Get change_set_ids from the ancestor commits
        combined_ancestry_change_sets(id) AS (
          SELECT change_set_id as id
          FROM "commit"
          WHERE id IN (SELECT id FROM combined_ancestry_commits)
        ),
        -- Get the commit for the current element's change set
        current_commit(id) AS (
          SELECT id 
          FROM "commit" 
          WHERE change_set_id = change_set_element.change_set_id
        ),
        -- Descendants: All commits from the current element's commit downwards
        descendant_commits(id) AS (
          SELECT id FROM current_commit
          UNION ALL
          SELECT ce.child_id
          FROM commit_edge ce
          JOIN descendant_commits d ON ce.parent_id = d.id
        ),
        -- Get change_set_ids from descendant commits
        descendant_change_sets(id) AS (
          SELECT change_set_id as id
          FROM "commit"
          WHERE id IN (SELECT id FROM descendant_commits)
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
          -- Newer element must be in the combined ancestry of the target commits
          AND newer_cse.change_set_id IN (SELECT id FROM combined_ancestry_change_sets)
          -- Newer element's change set must be a descendant of the current element's change set
          AND newer_cse.change_set_id IN (SELECT id FROM descendant_change_sets)
      )
    ` as any;
}
