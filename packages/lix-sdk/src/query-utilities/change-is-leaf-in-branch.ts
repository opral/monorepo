import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { Branch, LixDatabaseSchema } from "../database/schema.js";

/**
 * Selects changes that are not a parent of any other change within the specified branch.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change")
 *     .where(changeIsLeafInBranch(currentBranch))
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function changeIsLeafInBranch(branch: Pick<Branch, "change_set_id">) {
	return sql`
    change.id IN (
      WITH RECURSIVE branch_changes(id) AS (
        SELECT change_id AS id
        FROM change_set_element
        WHERE change_set_id = ${branch.change_set_id}
        UNION ALL
        SELECT change_graph_edge.parent_id AS id
        FROM change_graph_edge
        INNER JOIN branch_changes ON branch_changes.id = change_graph_edge.child_id
      )
      SELECT id FROM branch_changes
      WHERE id NOT IN (
        SELECT parent_id
        FROM change_graph_edge
        WHERE child_id IN (SELECT id FROM branch_changes)
      )
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
