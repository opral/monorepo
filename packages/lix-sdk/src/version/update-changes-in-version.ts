import { executeSync } from "../database/execute-sync.js";
import type { Version, Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Updates the changes that are part of a version.
 *
 * @deprecated
 *
 * This function will update the change_set_element table to point to the new changes.
 */
export async function updateChangesInVersion(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	version: Pick<Version, "id">;
	changes: Change[];
}): Promise<void> {
	// const executeInTransaction = async (trx: Lix["db"]) => {
	for (const change of args.changes ?? []) {
		executeSync({
			lix: args.lix,
			query: args.lix.db
				.insertInto("version_change")
				.values({
					version_id: args.version.id,
					change_id: change.id,
					entity_id: change.entity_id,
					schema_key: change.schema_key,
					file_id: change.file_id,
				})
				.onConflict((oc) =>
					oc.doUpdateSet((eb) => ({ change_id: eb.ref("excluded.change_id") }))
				),
		});
	}

	// await updateChangeConflicts({
	// 	lix: { ...args.lix, db: trx },
	// 	version,
	// });
	// };

	// if (args.lix.db.isTransaction) {
	// 	await executeInTransaction(args.lix.db);
	// } else {
	// 	await args.lix.db.transaction().execute(executeInTransaction);
	// }

	// await garbageCollectChangeConflicts({ lix: args.lix });
}
