import { sql } from "kysely";
import type { ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Garbage collects change conflicts.
 *
 * A change conflict is considered garbage if the conflict
 * contains changes that no version change pointer points to.
 */
export async function garbageCollectChangeConflicts(args: {
	lix: Pick<Lix, "db">;
}): Promise<{
	deletedChangeConflicts: ChangeConflict[];
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// no versions are pointing to the change conflict anymore
		// this can happen if a version is deleted or if the conflict is outdated
		// -> delete the conflict
		const conflictsWithVersionPointer = await trx
			.selectFrom("change_conflict")
			.leftJoin(
				"version_change_conflict",
				"change_conflict.id",
				"version_change_conflict.change_conflict_id",
			)
			.where("version_change_conflict.change_conflict_id", "is", null)
			.selectAll()
			.execute();

		// Find change conflicts where no version change pointer points to any of its elements
		const outdatedConflicts = await trx
			.selectFrom("change_conflict")
			.leftJoin(
				"change_set_element as conflict_elements",
				"change_conflict.change_set_id",
				"conflict_elements.change_set_id",
			)
			.leftJoin(
				"change_set_element as version_elements",
				"conflict_elements.change_id",
				"version_elements.change_id",
			)
			.groupBy("change_conflict.id")
			// TODO assumes that each change conflict element is a unique entity change
			// TODO watch out if this assumption holds true in the future
			//
			// if the number of changes in the conflict that have a corresponding version change pointer
			// is less than the total number of changes in the conflict, then there is at least one change
			// that no version change pointer references, aka the conflict is outdated.
			.having(
				sql`count(version_elements.change_id)`,
				// the number of changes in the conflict that have a corresponding version change pointer.
				"<",
				// the total number of changes in the conflict.
				sql`count(conflict_elements.change_id)`,
			)
			.selectAll("change_conflict")
			.execute();

		const conflictsToDelete = [
			...conflictsWithVersionPointer,
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
				.deleteFrom("change_set_element")
				.where(
					"change_set_element.change_set_id",
					"in",
					conflictsToDelete.map((conflict) => conflict.change_set_id),
				)
				.execute();

			await trx
				.deleteFrom("version_change_conflict")
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
