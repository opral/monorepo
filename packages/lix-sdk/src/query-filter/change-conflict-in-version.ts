import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { Version, LixDatabaseSchema } from "../database/schema.js";

/**
 * Filters if a conflict is in the given version.
 *
 * @example
 *   ```ts
 *   const conflicts = await lix.db.selectFrom("change_conflict")
 *      .where(changeConflictInVersion(currentVersion))
 *      .selectAll()
 *      .execute();
 *   ```
 */
export function changeConflictInVersion(version: Pick<Version, "id">) {
	return (
		eb: ExpressionBuilder<LixDatabaseSchema, "change_conflict">,
	): ExpressionWrapper<LixDatabaseSchema, "change_conflict", SqlBool> =>
		eb("change_conflict.id", "in", (subquery) =>
			subquery
				.selectFrom("version_change_conflict")
				.select("change_conflict_id")
				.where("version_change_conflict.version_id", "=", version.id),
		);
}
