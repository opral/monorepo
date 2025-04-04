import { selectActiveVersion } from "../queries";
import { lix } from "../state";
import { createChangeSet, createDiscussion } from "@lix-js/sdk";

export async function createCheckpointV2(commentText?: string) {
	const activeVersion = await selectActiveVersion();

	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: activeVersion.change_set_id,
				label_id: checkpointLabel.id,
			})
			.execute();

		const newChangeSet = await createChangeSet({
			lix: { db: trx },
			changes: [],
			labels: [],
			parents: [{ id: activeVersion.change_set_id }],
		});

		await trx
			.updateTable("version_v2")
			.set({
				change_set_id: newChangeSet.id,
			})
			.where("id", "=", activeVersion.id)
			.execute();

		// Create a discussion with the provided comment if it exists
		if (commentText && commentText.trim()) {
			await createDiscussion({
				lix: { db: trx },
				changeSet: {
					id: activeVersion.change_set_id,
				},
				firstComment: {
					content: commentText,
				},
			});
		}
	});
}
