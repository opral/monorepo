import type { Change, ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new change conflict with the given conflicting changes.
 *
 * @param args.key - The key of the change conflict.
 * @param args.conflictingChanges - The conflicting changes.
 */
export async function createChangeConflict(args: {
	lix: Lix;
	key: string;
	conflictingChangeIds: Set<Change["id"]>;
}): Promise<ChangeConflict> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Check if a conflict with the same key and one or more of the given change IDs already exists
		const existingConflict = await trx
			.selectFrom("change_conflict")
			.innerJoin(
				"change_conflict_element",
				"change_conflict.id",
				"change_conflict_element.change_conflict_id",
			)
			.where("change_conflict.key", "=", args.key)
			.where(
				"change_conflict_element.change_id",
				"in",
				Array.from(args.conflictingChangeIds),
			)
			.selectAll("change_conflict")
			.executeTakeFirst();

		const conflict =
			existingConflict ??
			(await trx
				.insertInto("change_conflict")
				.values({
					key: args.key,
				})
				.returningAll()
				.executeTakeFirstOrThrow());

		await trx
			.insertInto("change_conflict_element")
			.values(
				Array.from(args.conflictingChangeIds).map((id) => ({
					change_id: id,
					change_conflict_id: conflict.id,
				})),
			)
			// Ignore if the conflict element already exists
			.onConflict((oc) => oc.doNothing())
			.execute();

		return conflict;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
