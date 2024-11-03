import type { Branch, Change } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";

export async function updateBranchPointers(args: {
	lix: Pick<Lix, "db">;
	branch: Pick<Branch, "id">;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx
			.insertInto("branch_change_pointer")
			.values(
				args.changes.map((change) => ({
					branch_id: args.branch.id,
					change_id: change.id,
					change_entity_id: change.entity_id,
					change_file_id: change.file_id,
					change_type: change.type,
				})),
			)
			// pointer for this branch and change_entity, change_file, change_type
			// already exists, then update the change_id
			.onConflict((oc) =>
				oc.doUpdateSet((eb) => ({
					change_id: eb.ref("excluded.change_id"),
				})),
			)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
