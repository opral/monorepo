import type { Version, Change, ChangeConflict } from "../database/schema.js";
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
	version: Pick<Version, "id">;
	conflictingChangeIds: Set<Change["id"]>;
}): Promise<ChangeConflict> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Check if a conflict with the same key and identical change IDs already exists
		const existingConflict = await trx
			.selectFrom("change_conflict")
			.innerJoin(
				"version_change_conflict",
				"version_change_conflict.change_conflict_id",
				"change_conflict.id",
			)
			// the version should point to the conflict
			.where("version_change_conflict.version_id", "=", args.version.id)
			// which has the identical key
			.where("change_conflict.key", "=", args.key)
			// and same set of changes
			.where((eb) =>
				eb.exists(
					trx
						.selectFrom("change_set_element")
						.innerJoin("change_conflict", (join) =>
							join.onRef(
								"change_conflict.change_set_id",
								"=",
								"change_set_element.change_set_id",
							),
						)
						.where(
							"change_set_element.change_id",
							"in",
							Array.from(args.conflictingChangeIds),
						)
						.groupBy("change_set_element.change_set_id")
						.having(
							trx.fn.count("change_set_element.change_id"),
							"=",
							args.conflictingChangeIds.size,
						)
						.select("change_set_element.change_set_id"),
				),
			)
			.selectAll()
			.executeTakeFirst();

		if (existingConflict) {
			// Return the existing conflict if it already exists
			return existingConflict;
		}

		const newChangeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returning("id")
			.executeTakeFirstOrThrow();

		const newConflict = await trx
			.insertInto("change_conflict")
			.values({
				key: args.key,
				change_set_id: newChangeSet.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_set_element")
			.values(
				Array.from(args.conflictingChangeIds).map((id) => ({
					change_id: id,
					change_set_id: newConflict.change_set_id,
				})),
			)
			// Ignore if the conflict element already exists
			.onConflict((oc) => oc.doNothing())
			.execute();

		await trx
			.insertInto("version_change_conflict")
			.values({
				version_id: args.version.id,
				change_conflict_id: newConflict.id,
			})
			.execute();

		return newConflict;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
