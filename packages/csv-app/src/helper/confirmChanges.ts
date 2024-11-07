import { Change, changeIsLeafOf, Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs.ts";

export const confirmChanges = async (
	lix: Lix,
	unconfirmedChanges: Change[]
) => {
	const changeSet = await lix.db.transaction().execute(async (trx) => {
		// create a new set
		const newChangeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returning("id")
			.executeTakeFirstOrThrow();

		// get the id of the confirmed tag
		const confirmedLabel = await trx
			.selectFrom("label")
			.where("name", "=", "confirmed")
			.select("id")
			.executeTakeFirstOrThrow();

		// tag the set as confirmed
		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: newChangeSet.id,
				label_id: confirmedLabel.id,
			})
			.execute();

		// insert the leaf changes into the set
		for (const change of unconfirmedChanges) {
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
