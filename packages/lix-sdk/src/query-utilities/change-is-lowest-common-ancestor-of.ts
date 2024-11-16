import { ExpressionWrapper, sql } from "kysely";
import type { Change, LixDatabaseSchema } from "../database/schema.js";
import type { SqlBool } from "kysely";

/**
 * Filters changes that are the lowest common ancestor of the given changes.
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
      -- Start by getting all ancestors for the given changes
      -- (can be optimized later to early exit if a common ancestor is found)
      WITH RECURSIVE all_ancestors(change_id, ancestor_id) AS (
        SELECT child_id as change_id, parent_id as ancestor_id
        FROM change_edge
        WHERE change_id IN (${sql.join(changes.map((c) => c.id))})
        UNION ALL
        SELECT all_ancestors.change_id, change_edge.parent_id AS ancestor_id
        FROM change_edge
        INNER JOIN all_ancestors ON all_ancestors.ancestor_id = change_edge.child_id
      ),
      -- the lowest common ancestor will have a change count equal 
      -- to the number of changes that have been provided 
      ancestor_counts(ancestor_id, count) AS (
        SELECT ancestor_id, COUNT(DISTINCT change_id) AS count
        FROM all_ancestors
        GROUP BY ancestor_id
        HAVING COUNT(DISTINCT change_id) = ${changes.length} -- Only include ancestors common to all changes
      )
      -- Select the LCA
      SELECT ancestor_id
      FROM ancestor_counts
      -- filter common ancestors that are not the lowest common ancestor
      -- by checking if the ancestor is not a child of another ancestor
      WHERE ancestor_id NOT IN (
        SELECT change_edge.child_id
        FROM change_edge
        INNER JOIN ancestor_counts ON ancestor_counts.ancestor_id = change_edge.parent_id
      )
      -- Direct parent check: include changes that are a direct parent of all other changes
      UNION ALL
      SELECT parent_id
      FROM change_edge
      WHERE parent_id IN (${sql.join(changes.map((c) => c.id))})
      GROUP BY parent_id
      HAVING COUNT(DISTINCT child_id) = ${changes.length - 1} -- -1 because one change must be parent of all other changes
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
