import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Selects change sets that have a label with the given name.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change_set")
 *      .where(changeSetHasLabel({ name: "checkpoint" }))
 *      .selectAll()
 *      .execute();
 *   ```
 *
 * @example
 *   You can use eb.not() to negate the filter.
 *
 *   ```ts
 *   await lix.db.selectFrom("change_set")
 * 		.where((eb) => eb.not(changeSetHasLabel({ name: "checkpoint" })))
 * 		.selectAll()
 * 		.execute();
 *   ```
 *
 * @example
 *   Id lookup also works:
 *
 *   ```ts
 *   await lix.db.selectFrom("change_set")
 * 		.where(changeSetHasLabel({ id: "39j9afj2" }))
 * 		.selectAll()
 * 		.execute();
 *   ```
 */
export function changeSetHasLabel(
	// lookup can happen via both id or name
	label: { id: string; name?: string } | { name: string; id?: string }
) {
	return (
		eb: ExpressionBuilder<LixDatabaseSchema, "change_set_all">
	): ExpressionWrapper<LixDatabaseSchema, "change_set_all", SqlBool> =>
		eb("change_set_all.id", "in", (subquery) =>
			subquery
				.selectFrom("change_set_label_all")
				.innerJoin("label", "label.id", "change_set_label_all.label_id")
				.select("change_set_label_all.change_set_id")
				.$if("name" in label, (eb) => eb.where("label.name", "=", label.name!))
				.$if("id" in label, (eb) => eb.where("label.id", "=", label.id!))
		);
}
