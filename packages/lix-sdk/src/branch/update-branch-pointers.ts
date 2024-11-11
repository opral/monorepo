import { garbageCollectChangeConflicts } from "../change-conflict/garbage-collect-change-conflicts.js";
import type { Branch, Change, ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Updates the branch pointers for the given branch with the given changes.
 *
 * @args branch - The branch to update the pointers for. If not provided, the current branch is used.
 */
export async function updateBranchPointers(args: {
	lix: Pick<Lix, "db">;
	changes?: Change[];
	changeConflicts?: ChangeConflict[];
	branch?: Pick<Branch, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const branch =
			args.branch ??
			(await trx
				.selectFrom("current_branch")
				.selectAll()
				.executeTakeFirstOrThrow());

		if (args.changes) {
			const changePointers = args.changes.map((change) => ({
				branch_id: branch.id,
				change_id: change.id,
				change_entity_id: change.entity_id,
				change_file_id: change.file_id,
				change_type: change.type,
			}));

			if (changePointers.length > 0) {
				await trx
					.insertInto("branch_change_pointer")
					.values(changePointers)
					// pointer for this branch and change_entity, change_file, change_type
					// already exists, then update the change_id
					.onConflict((oc) =>
						oc.doUpdateSet((eb) => ({
							change_id: eb.ref("excluded.change_id"),
						})),
					)
					.execute();
			} else {
				// if there are no changes, then delete all pointers for the branch
				await trx
					.deleteFrom("branch_change_pointer")
					.where("branch_id", "=", branch.id)
					.execute();
			}
		}

		if (args.changeConflicts) {
			const changeConflictPointers = args.changeConflicts?.map((conflict) => ({
				branch_id: branch.id,
				change_conflict_id: conflict.id,
			}));
			if (changeConflictPointers.length > 0) {
				await trx
					.insertInto("branch_change_conflict_pointer")
					.values(
						args.changeConflicts?.map((conflict) => ({
							branch_id: branch.id,
							change_conflict_id: conflict.id,
						})) ?? [],
					)
					.onConflict((oc) => oc.doNothing())
					.execute();
			} else if (changeConflictPointers.length === 0) {
				// if there are no conflicts, then delete all pointers for the branch
				await trx
					.deleteFrom("branch_change_conflict_pointer")
					.where("branch_id", "=", branch.id)
					.execute();
			}
		}

		await garbageCollectChangeConflicts({ lix: { ...args.lix, db: trx } });
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
