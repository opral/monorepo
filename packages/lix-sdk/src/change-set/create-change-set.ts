import type { Change, ChangeSet } from "../database/schema.js";
import type { Lix } from "../types.js";

/**
 * Creates a change set with the given changes.
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change").selectAll().execute();
 *   const changeSet = await createChangeSet({ lix, changes });
 *   ```
 */
export async function createChangeSet(args: {
	lix: Partial<Lix> & { db: { transaction: Lix["db"]["transaction"] } };
	changes: Partial<Change> & { id: Change["id"] }[];
}): Promise<ChangeSet> {
	return await args.lix.db.transaction().execute(async (trx) => {
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
	});
}
