import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Selects changes that have a label with the given name.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change")
 *      .where(changeHasLabel("confirmed"))
 *      .selectAll()
 *      .execute();
 *   ```
 *
 * @example
 *   You can use eb.not() to negate the filter.
 *
 *   ```ts
 *   await lix.db.selectFrom("change")
 * 		.where((eb) => eb.not(changeHasLabel("confirmed")))
 * 		.selectAll()
 * 		.execute();
 *   ```
 */
export function changeHasLabel(name: string) {
	return (
		eb: ExpressionBuilder<LixDatabaseSchema, "change">,
	): ExpressionWrapper<LixDatabaseSchema, "change", SqlBool> =>
		eb("change.id", "in", (subquery) =>
			subquery
				.selectFrom("change_set_element")
				.innerJoin(
					"change_set_label",
					"change_set_label.change_set_id",
					"change_set_element.change_set_id",
				)
				.innerJoin("label", "label.id", "change_set_label.label_id")
				.select("change_set_element.change_id")
				.where("label.name", "=", name),
		);
}
