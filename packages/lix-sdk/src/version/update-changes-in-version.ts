import type { Version, Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Updates the changes that are part of a version.
 *
 * This function will update the change_set_element table to point to the new changes.
 */
export async function updateChangesInVersion(args: {
	lix: Pick<Lix, "db" | "plugin">;
	version: Pick<Version, "id" | "change_set_id">;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		for (const change of args.changes ?? []) {
			// Change for the same entity_id, schema_key and file_id should be unique
			const existingEntityChange = await trx
				.selectFrom("change")
				.innerJoin(
					"change_set_element",
					"change.id",
					"change_set_element.change_id",
				)
				.where(
					"change_set_element.change_set_id",
					"=",
					args.version.change_set_id,
				)
				.where("change.schema_key", "=", change.schema_key)
				.where("change.entity_id", "=", change.entity_id)
				.where("change.file_id", "=", change.file_id)
				.selectAll()
				.executeTakeFirst();

			if (existingEntityChange) {
				// update the existing pointer
				await trx
					.updateTable("change_set_element")
					.set("change_id", change.id)
					.where("change_set_id", "=", args.version.change_set_id)
					.where("change_id", "=", existingEntityChange.id)
					.execute();
			} else {
				// create a new pointer
				await trx
					.insertInto("change_set_element")
					.values({
						change_set_id: args.version.change_set_id,
						change_id: change.id,
					})
					.execute();
			}
		}

		// await updateChangeConflicts({
		// 	lix: { ...args.lix, db: trx },
		// 	version,
		// });
	};

	if (args.lix.db.isTransaction) {
		await executeInTransaction(args.lix.db);
	} else {
		await args.lix.db.transaction().execute(executeInTransaction);
	}

	// await garbageCollectChangeConflicts({ lix: args.lix });
}
