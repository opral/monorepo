import { ExpressionWrapper, sql } from "kysely";
import type { Branch, LixDatabaseSchema } from "../database/schema.js";
import type { SqlBool } from "kysely";

/**
 * Filters if a change is in the given branch.
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change")
 *      .where(changeInBranch(currentBranch.id))
 *      .selectAll()
 *      .execute();
 *   ```
 */
export function changeInBranch(branch: Pick<Branch, "id">) {
	// Kysely does not support WITH RECURSIVE in a subquery, so we have to
	// use a raw SQL expression here and map the type for TypeScript.
	//
	// The return type cast was figured out by looking at another filter.
	return sql`
    change.id IN (
			WITH RECURSIVE recursive_changes(id) AS (
				SELECT change_id AS id
				FROM branch_change_pointer
				WHERE branch_id = ${branch.id}
				UNION ALL
				SELECT change_graph_edge.parent_id AS id
				FROM change_graph_edge
				INNER JOIN recursive_changes ON recursive_changes.id = change_graph_edge.child_id
			)
			SELECT id FROM recursive_changes
		)
` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
