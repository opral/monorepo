import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import type { Branch } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { diffBranch } from "./diff-branch.js";

export async function mergeBranch(args: {
	lix: Lix;
	sourceBranch: Branch;
	targetBranch: Branch;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const diff = await diffBranch({
			lix: { ...args.lix, db: trx },
			sourceBranch: args.sourceBranch,
			targetBranch: args.targetBranch,
		});

		// update the branch change pointers for non-conflicting changes
		await Promise.all(
			diff.changePointers.map(async (pointer) => {
				// if the target branch has a pointer for the entity
				// change, check if there is a conflict
				if (pointer.target_change_id) {
					const detectedConflict = diff.detectedConflicts.find((conflict) =>
						conflict.conflictingChangeIds.has(
							pointer.target_change_id as string,
						),
					);
					if (detectedConflict) {
						// don't update the branch change pointer
						return;
					}
				}

				// the change is not conflicting. the pointer can be updated
				if (pointer.source_change_id) {
					await trx
						.insertInto("branch_change_pointer")
						.values([
							{
								branch_id: args.targetBranch.id,
								change_id: pointer.source_change_id,
								change_file_id: pointer.change_file_id,
								change_entity_id: pointer.change_entity_id,
								change_schema_key: pointer.change_schema_key,
							},
						])
						.onConflict((oc) =>
							oc.doUpdateSet({ branch_id: args.targetBranch.id }),
						)
						.execute();
				}
			}),
		);

		// insert the detected conflicts
		// (ignore if the conflict already exists)
		for (const detectedConflict of diff.detectedConflicts) {
			const conflict = await createChangeConflict({
				lix: { ...args.lix, db: trx },
				branch: args.targetBranch,
				key: detectedConflict.key,
				conflictingChangeIds: detectedConflict.conflictingChangeIds,
			});

			// todo move to createChangeConflict
			await trx
				.insertInto("branch_change_conflict_pointer")
				.values({
					branch_id: args.targetBranch.id,
					change_conflict_id: conflict.id,
				})
				.onConflict((oc) => oc.doNothing())
				.execute();
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
