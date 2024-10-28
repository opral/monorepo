import type { ExpressionBuilder } from "kysely";
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
 */
export function changeHasLabel(name: string) {
	return (eb: ExpressionBuilder<LixDatabaseSchema, "change">) =>
		eb("change.id", "in", (subquery) =>
			subquery
				.selectFrom("change_set_item")
				.innerJoin(
					"change_set_label",
					"change_set_label.change_set_id",
					"change_set_item.change_set_id",
				)
				.innerJoin("label", "label.id", "change_set_label.label_id")
				.select("change_set_item.change_id")
				.where("label.name", "=", name),
		);
}
