import type { ExpressionBuilder } from "kysely";
import type { Branch, LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters if a conflict is in the given branch.
 *
 * @example
 *   ```ts
 *   const conflicts = await lix.db.selectFrom("change_conflict")
 *      .where(changeConflictInBranch(currentBranch))
 *      .selectAll()
 *      .execute();
 *   ```
 */
export function changeConflictInBranch(branch: Pick<Branch, "id">) {
	return (eb: ExpressionBuilder<LixDatabaseSchema, "change_conflict">) =>
		eb("change_conflict.id", "in", (subquery) =>
			subquery
				.selectFrom("branch_change_conflict_pointer")
				.select("change_conflict_id")
				.where("branch_change_conflict_pointer.branch_id", "=", branch.id),
		);
}
