import type { Version, Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Updates the changes that are part of a version.
 *
 * This function will update the change_set_element table to point to the new changes.
 */
export async function updateChangesInVersion(args: {
	lix: Pick<Lix, "db" | "plugin">;
	version: Version;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		for (const change of args.changes ?? []) {
			// Change for the same entity_id, schema_key and file_id should be unique
			const existingEntityChange = await trx
				.selectFrom("change")
				.innerJoin("version_change", "change.id", "version_change.change_id")
				.where("version_change.version_id", "=", args.version.id)
				.where("change.schema_key", "=", change.schema_key)
				.where("change.entity_id", "=", change.entity_id)
				.where("change.file_id", "=", change.file_id)
				.selectAll()
				.executeTakeFirst();

			if (existingEntityChange) {
				// update the existing pointer
				await trx
					.updateTable("version_change")
					.set("change_id", change.id)
					.where("change_id", "=", existingEntityChange.id)
					.where("version_id", "=", args.version.id)
					.execute();
			} else {
				// create a new pointer
				await trx
					.insertInto("version_change")
					.values({
						version_id: args.version.id,
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
