import { selectCurrentChangeSet } from "../queries";
import { lix } from "../state";
import { createDiscussion } from "@lix-js/sdk";

export async function createCheckpointV2(commentText?: string) {
	const currentChangeSet = await selectCurrentChangeSet();

	if (!currentChangeSet) {
		throw new Error("No current change set found");
	}

	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		trx
			.deleteFrom("change_set_label")
			.where("change_set_id", "=", currentChangeSet.id)
			.execute();

		trx
			.insertInto("change_set_label")
			.values({
				change_set_id: currentChangeSet.id,
				label_id: checkpointLabel.id,
			})
			.execute();
	});

	// Create a discussion with the provided comment if it exists
	if (commentText && commentText.trim()) {
		await createDiscussion({
			lix,
			changeSet: {
				id: currentChangeSet.id,
			},
			firstComment: {
				content: commentText,
			},
		});
	}
}
