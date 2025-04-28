// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ExpressionWrapper, sql } from "kysely";
import type { Change, LixDatabaseSchema } from "../database/schema.js";
import type { SqlBool } from "kysely";

/**
 * Filters changes that are the lowest common ancestor of the given changes.
 *
 * @deprecated No new api exists yet for the change set graph. Write on discord if you need it
 *
 * @example
 *   ```ts
 *   const lowestCommonAncestor = await lix.db.selectFrom("change")
 *      .where(changeIsLowestCommonAncestorOf([change1, change2, change3]))
 *      .selectAll()
 *      .executeTakeFirst();
 *   ```
 */
export function changeIsLowestCommonAncestorOf(changes: Pick<Change, "id">[]) {
	return sql`
    change.id IN (
      -- Recursive CTE to find ancestors level by level
      WITH RECURSIVE step_ancestors(ancestor_id, originating_change, depth) AS (
        -- Base case: Start with the input changes themselves
        SELECT 
          id AS ancestor_id, 
          id AS originating_change, 
          0 AS depth
        FROM change
        WHERE id IN (${sql.join(changes.map((c) => c.id))})

        UNION ALL

        -- Recursive step: Find the parents of the current ancestors
        SELECT 
          change_edge.parent_id AS ancestor_id, 
          step_ancestors.originating_change, 
          step_ancestors.depth + 1 AS depth
        FROM change_edge
        INNER JOIN step_ancestors 
          ON change_edge.child_id = step_ancestors.ancestor_id
      ),
      -- Aggregate ancestors to find the first common one
      common_ancestors AS (
        SELECT 
          ancestor_id, 
          COUNT(DISTINCT originating_change) AS change_count, -- Count distinct input changes contributing to each ancestor
          MIN(depth) AS min_depth -- The closest (lowest) ancestor has the smallest depth
        FROM step_ancestors
        GROUP BY ancestor_id
        HAVING COUNT(DISTINCT originating_change) = ${changes.length} -- Only include ancestors shared by all input changes
      )
      -- Select the lowest common ancestor
      SELECT ancestor_id
      FROM common_ancestors
      ORDER BY min_depth ASC, ancestor_id ASC -- Prioritize closest ancestor, tie-break by ID
      LIMIT 1 -- Return only the lowest common ancestor
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
