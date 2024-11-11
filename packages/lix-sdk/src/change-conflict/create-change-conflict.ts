import type { Branch, Change, ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new change conflict with the given conflicting changes.
 *
 * @param args.key - The key of the change conflict.
 * @param args.conflictingChanges - The conflicting changes.
 */
export async function createChangeConflict(args: {
	lix: Pick<Lix, "db">;
	key: string;
	branch: Pick<Branch, "id">;
	conflictingChangeIds: Set<Change["id"]>;
}): Promise<ChangeConflict> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Check if a conflict with the same key and identical change IDs already exists
		const existingConflict = await trx
			.selectFrom("change_conflict")
			.where("change_conflict.key", "=", args.key)
			.where((eb) =>
				eb.exists(
					trx
						.selectFrom("change_conflict_element")
						.innerJoin("change_conflict", (join) =>
							join.onRef(
								"change_conflict_element.change_conflict_id",
								"=",
								"change_conflict.id",
							),
						)
						.where(
							"change_conflict_element.change_id",
							"in",
							Array.from(args.conflictingChangeIds),
						)
						.groupBy("change_conflict_element.change_conflict_id")
						.having(
							trx.fn.count("change_conflict_element.change_id"),
							"=",
							args.conflictingChangeIds.size,
						)
						.select("id"),
				),
			)
			.selectAll()
			.executeTakeFirst();

		if (existingConflict) {
			// Return the existing conflict if it already exists
			return existingConflict;
		}

		const newConflict = await trx
			.insertInto("change_conflict")
			.values({
				key: args.key,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_conflict_element")
			.values(
				Array.from(args.conflictingChangeIds).map((id) => ({
					change_id: id,
					change_conflict_id: newConflict.id,
				})),
			)
			// Ignore if the conflict element already exists
			.onConflict((oc) => oc.doNothing())
			.execute();

		// TODO
		// await trx
		// 	.insertInto("branch_change_conflict_pointer")
		// 	.values({
		// 		branch_id: args.branch.id,
		// 		change_conflict_id: newConflict.id,
		// 	})
		// 	.execute();

		return newConflict;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
