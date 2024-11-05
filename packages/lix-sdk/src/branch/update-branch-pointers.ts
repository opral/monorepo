import type { Branch, Change } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";

/**
 * Updates the branch pointers for the given branch with the given changes.
 * 
 * @args branch - The branch to update the pointers for. If not provided, the current branch is used.
 */
export async function updateBranchPointers(args: {
	lix: Pick<Lix, "db">;
	changes: Change[];
	branch?: Pick<Branch, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const branch =
			args.branch ??
			(await trx
				.selectFrom("current_branch")
				.selectAll()
				.executeTakeFirstOrThrow());

		await trx
			.insertInto("branch_change_pointer")
			.values(
				args.changes.map((change) => ({
					branch_id: branch.id,
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
