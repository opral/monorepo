import type { Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

export async function applyLixOwnEntityChange(args: {
	lix: Lix;
	change: Change;
}): Promise<void> {
	if (args.change.plugin_key !== "lix-own-entity") {
		throw new Error(
			"Expected 'lix-own-entity' as plugin key but received " +
				args.change.plugin_key
		);
	}
	const executeInTransaction = async (trx: Lix["db"]) => {
		const snapshot = await trx
			.selectFrom("snapshot")
			.where("id", "=", args.change.snapshot_id)
			.select("content")
			.executeTakeFirstOrThrow();

		if (snapshot.content === null) {
			// deletion
			await trx
				.deleteFrom("key_value")
				.where("key", "=", args.change.entity_id)
				.execute();
		} else {
			// upsert
			await trx
				.insertInto("key_value")
				.values({
					key: snapshot.content.key,
					value: snapshot.content.value,
				})
				.onConflict((oc) => oc.doUpdateSet({ value: snapshot.content!.value }))
				.execute();
		}
	};
	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
