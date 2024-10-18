import type { ExpressionBuilder } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * This is a simulated current branch until the
 * branching concept is implemented https://linear.app/opral/issue/LIX-126/branching.
 *
 * Feel free to use your own simulated branch implementation.
 *
 * @example
 *   const changesInCurrentBranch = await lix.db
 *     .selectFrom("change")
 *     .selectAll()
 *     .where(isInSimulatedBranch)
 *     .execute();
 */
export function isInSimulatedCurrentBranch(
	eb: ExpressionBuilder<LixDatabaseSchema, "change">,
) {
	return eb.or([
		// change is  not in a conflict
		eb("change.id", "not in", (subquery) =>
			subquery.selectFrom("conflict").select("conflict.change_id").unionAll(
				// @ts-expect-error - no idea why
				subquery
					.selectFrom("conflict")
					.select("conflict.conflicting_change_id"),
			),
		),
		// change is in a conflict that has not been resolved
		// AND the change is not the conflicting one
		eb("change.id", "in", (subquery) =>
			subquery
				.selectFrom("conflict")
				.select("conflict.change_id")
				.where("conflict.resolved_change_id", "is", null),
		),
		// change is in a conflict and is the resolved one
		eb("change.id", "in", (subquery) =>
			subquery.selectFrom("conflict").select("conflict.resolved_change_id"),
		),
	]);
}
