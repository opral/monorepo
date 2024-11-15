import type { ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Garbage collects change conflicts.
 *
 * A change conflict is considered garbage if the conflict
 * contains changes that no branch change pointer points to.
 */
export async function garbageCollectChangeConflicts(args: {
	lix: Pick<Lix, "db">;
}): Promise<{
	deletedChangeConflicts: ChangeConflict[];
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// no branches are pointing to the change conflict anymore
		// this can happen if a branch is deleted or if the conflict is outdated
		// -> delete the conflict
		const conflictsWithNoBranchPointer = await trx
			.selectFrom("change_conflict")
			.leftJoin(
				"branch_change_conflict_pointer",
				"change_conflict.id",
				"branch_change_conflict_pointer.change_conflict_id",
			)
			.where("branch_change_conflict_pointer.change_conflict_id", "is", null)
			.selectAll()
			.execute();

		// Find change conflicts where no branch change pointer points to any of its elements
		const outdatedConflicts = await trx
			.selectFrom("change_conflict")
			.leftJoin(
				"change_conflict_element",
				"change_conflict.id",
				"change_conflict_element.change_conflict_id",
			)
			.leftJoin(
				"branch_change_pointer",
				"change_conflict_element.change_id",
				"branch_change_pointer.change_id",
			)
			.groupBy("change_conflict.id")
			// TODO assumes that each change conflict element is a unique entity change
			// TODO watch out if this assumption holds true in the future
			//
			// if the number of changes in the conflict that have a corresponding branch change pointer
			// is less than the total number of changes in the conflict, then there is at least one change
			// that no branch change pointer references, aka the conflict is outdated.
			.having(
				// the number of changes in the conflict that have a corresponding branch change pointer.
				trx.fn.count("branch_change_pointer.change_id"),
				"<",
				// the total number of changes in the conflict.
				trx.fn.count("change_conflict_element.change_id"),
			)
			.selectAll("change_conflict")
			.execute();

		const conflictsToDelete = [
			...conflictsWithNoBranchPointer,
			...outdatedConflicts,
		];

		// Delete the identified change conflicts and their associated pointers
		if (conflictsToDelete.length > 0) {
			const conflictIds = conflictsToDelete.map((conflict) => conflict.id);
			await trx
				.deleteFrom("change_conflict")
				.where("id", "in", conflictIds)
				.execute();

			await trx
				.deleteFrom("change_conflict_element")
				.where("change_conflict_id", "in", conflictIds)
				.execute();

			await trx
				.deleteFrom("branch_change_conflict_pointer")
				.where("change_conflict_id", "in", conflictIds)
				.execute();
		}
		return { deletedChangeConflicts: conflictsToDelete };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
