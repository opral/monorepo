import type { ChangeSet } from "../database/schema.js";
import type { Lix } from "../types.js";

export async function createChangeSet(args: {
	lix: Lix;
	changeIds: string[];
}): Promise<ChangeSet> {
	return await args.lix.db.transaction().execute(async (trx) => {
		const changeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		for (const changeId of args.changeIds) {
			await trx
				.insertInto("change_set_membership")
				.values({
					change_id: changeId,
					change_set_id: changeSet.id,
				})
				.execute();
		}
		return changeSet;
	});
}
