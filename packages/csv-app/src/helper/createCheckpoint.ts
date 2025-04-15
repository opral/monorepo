import { Change, changeIsLeafOf, Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs.ts";

export const createCheckpoint = async (
	lix: Lix,
	intermediateChanges: Change[]
) => {
	const changeSet = await lix.db.transaction().execute(async (trx) => {
		// create a new set
		const newChangeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returning("id")
			.executeTakeFirstOrThrow();

		// get the id of the checkpoint tag
		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// tag the set as confirmed
		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: newChangeSet.id,
				label_id: checkpointLabel.id,
			})
			.execute();

		// insert the leaf changes into the set
		for (const change of intermediateChanges) {
			const leafChange = await trx
				.selectFrom("change")
				.where(changeIsLeafOf(change))
				.selectAll()
				.executeTakeFirstOrThrow();
			await trx
				.insertInto("change_set_element")
				.values({
					change_set_id: newChangeSet.id,
					change_id: leafChange.id,
					entity_id: leafChange.entity_id,
					schema_key: leafChange.schema_key,
					file_id: leafChange.file_id,
				})
				// the leaf change is contained in the set already
				.onConflict((oc) => oc.doNothing())
				.execute();
		}
		return newChangeSet;
	});
	await saveLixToOpfs({ lix });
	return changeSet;
};
