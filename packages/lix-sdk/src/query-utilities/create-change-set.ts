import type { Change, ChangeSet } from "../database/schema.js";
import type { Lix } from "../types.js";

/**
 * Creates a change set with the given changes, optionally within an open transaction.
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change").selectAll().execute();
 *   const changeSet = await createChangeSet({ db: lix.db, changes });
 *   ```
 */
export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	changes: Pick<Change, "id">[];
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const changeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_set_item")
			.values(
				args.changes.map((change) => ({
					change_id: change.id,
					change_set_id: changeSet.id,
				})),
			)
			.execute();
		return changeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
