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
		const conflict = await trx
			.insertInto("change_conflict")
			.values({
				key: args.key,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_conflict_edge")
			.values(
				Array.from(args.conflictingChangeIds).map((id) => ({
					change_id: id,
					change_conflict_id: conflict.id,
				})),
			)
			.execute();

		return conflict;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
