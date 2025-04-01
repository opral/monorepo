import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";
import type { GraphTraversalMode } from "../database/graph-traversal-mode.js";

/**
 * Filter to select changes that belong to a specified change set or its ancestors.
 *
 * @param changeSet The target change set
 * @param mode The {@link GraphTraversalMode} for traversing change sets:
 *             - `{ type: "direct" }` only includes the target change set
 *             - `{ type: "recursive", depth?: number }` includes ancestors, optionally limited by depth
 * @returns A SQL expression that selects changes belonging to the target change set or its ancestors
 */
export function changeSetIsAncestorOf(
	changeSet: Pick<ChangeSet, "id">,
	mode?: GraphTraversalMode
): ExpressionWrapper<LixDatabaseSchema, "change", SqlBool> {
	const effectiveMode = mode ?? { type: "recursive" };
	const maxDepth = effectiveMode.type === "direct" ? 0 : effectiveMode.depth;

	return sql`
    change_set_element.change_set_id IN (
      WITH RECURSIVE change_set_ancestors(ancestor_id, depth) AS (
        -- Start with the specified change set
        SELECT id AS ancestor_id, 0 AS depth
        FROM change_set
        WHERE id = ${changeSet.id}

        UNION ALL

        -- Traverse parents, but limit depth if specified
        SELECT 
          change_set_edge.parent_id, 
          change_set_ancestors.depth + 1
        FROM change_set_edge
        INNER JOIN change_set_ancestors 
          ON change_set_edge.child_id = change_set_ancestors.ancestor_id
        ${maxDepth !== undefined ? sql`WHERE change_set_ancestors.depth < ${maxDepth}` : sql``}
      )
      SELECT ancestor_id FROM change_set_ancestors
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
