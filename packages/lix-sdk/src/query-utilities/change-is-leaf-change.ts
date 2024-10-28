import type { ExpressionBuilder } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Selects changes that are not a parent of any other change.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change")
 *     .where(changeIsLeafChange())
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function changeIsLeafChange() {
	return (eb: ExpressionBuilder<LixDatabaseSchema, "change">) =>
		eb("change.id", "not in", (subquery) =>
			subquery
				.selectFrom("change_graph_edge")
				.select("change_graph_edge.parent_id"),
		);
}
