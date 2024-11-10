import type { ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Garbage collects change conflicts that contain changes
 * that no branch change pointer references (anymore).
 */
export async function garbageCollectChangeConflicts(args: {
	lix: Lix;
}): Promise<{
	deletedChangeConflicts: ChangeConflict[];
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Find change conflicts where no branch change pointer points to any of its elements
		const conflictsToDelete = await trx
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
			.having(trx.fn.count("branch_change_pointer.change_id"), "=", 0)
			.selectAll("change_conflict")
			.execute();

		// Delete the identified change conflicts
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
		}
		return { deletedChangeConflicts: conflictsToDelete };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
