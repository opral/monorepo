import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { ChangeSet, LixDatabaseSchema } from "../database/schema.js";

/**
 * Returns the symmetric difference between two change sets.
 *
 * The symmetric difference is the set of changes
 * that exist in either one version but not both.
 * Modeled after https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change_set_element")
 *     .where(changeSetElementInSymmetricDifference(a: changeSetA, b: changeSetB))
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function changeSetElementInSymmetricDifference(
	a: Pick<ChangeSet, "id">,
	b: Pick<ChangeSet, "id">,
) {
	return (
		eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">,
	): ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> =>
		eb.or([
			eb("change_set_element.change_id", "in", (subquery) =>
				subquery
					.selectFrom("change_set_element as A")
					.leftJoin("change_set_element as B", (join) =>
						join
							.onRef("A.change_id", "=", "B.change_id")
							.on("B.change_set_id", "=", b.id),
					)
					.where("A.change_set_id", "=", a.id)
					.where("B.change_id", "is", null)
					.select("A.change_id"),
			),
			eb("change_set_element.change_id", "in", (subquery) =>
				subquery
					.selectFrom("change_set_element as B")
					.leftJoin("change_set_element as A", (join) =>
						join
							.onRef("B.change_id", "=", "A.change_id")
							.on("A.change_set_id", "=", a.id),
					)
					.where("B.change_set_id", "=", b.id)
					.where("A.change_id", "is", null)
					.select("B.change_id"),
			),
		]);
}
