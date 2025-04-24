import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { Version, LixDatabaseSchema } from "../database/schema.js";

/**
 * Returns the symmetric difference between two versions for the version_change table.
 *
 * @deprecated Use `changeSetElementInSymmetricDifferenceOf` instead
 *
 * The symmetric difference is the set of changes
 * that exist in either one version but not both.
 * Modeled after https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("version_change")
 *     .where(versionChangeInSymmetricDifference(a: versionA, b: versionB))
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function versionChangeInSymmetricDifference(
	a: Pick<Version, "id">,
	b: Pick<Version, "id">
) {
	return (
		eb: ExpressionBuilder<LixDatabaseSchema, "version_change">
	): ExpressionWrapper<LixDatabaseSchema, "version_change", SqlBool> =>
		eb.or([
			eb("version_change.change_id", "in", (subquery) =>
				subquery
					.selectFrom("version_change as A")
					.leftJoin("version_change as B", (join) =>
						join
							.onRef("A.change_id", "=", "B.change_id")
							.on("B.version_id", "=", b.id)
					)
					.where("A.version_id", "=", a.id)
					.where("B.change_id", "is", null)
					.select("A.change_id")
			),
			eb("version_change.change_id", "in", (subquery) =>
				subquery
					.selectFrom("version_change as B")
					.leftJoin("version_change as A", (join) =>
						join
							.onRef("B.change_id", "=", "A.change_id")
							.on("A.version_id", "=", a.id)
					)
					.where("B.version_id", "=", b.id)
					.where("A.change_id", "is", null)
					.select("B.change_id")
			),
		]);
}
