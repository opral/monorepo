import {
	Lix,
	changeIsLeafInVersion,
	createDiscussion,
	createChangeSet,
} from "@lix-js/sdk";

/**
 * Creates a checkpoint with the specified entity changes and optional discussion
 *
 * An entity change is uniquely identified by:
 * - change.id
 * - change.schema_key
 * - change.plugin_key
 */
export const createCheckpoint = async (lix: Lix, message?: string) => {
	const changeSet = await lix.db.transaction().execute(async (trx) => {
		const currentVersion = await trx
			.selectFrom("current_version")
			.selectAll()
			.executeTakeFirstOrThrow();

		const changes = await trx
			.selectFrom("change")
			.innerJoin("file", "change.file_id", "file.id")
			// only getting the leaf changes as that is all that's required to restore the document
			.where(changeIsLeafInVersion(currentVersion))
			.where("file.path", "=", "/prosemirror.json")
			.select("change.id")
			.execute();

		const newChangeSet = await createChangeSet({
			lix: { db: trx },
			changes: changes,
		});

		// Get the checkpoint label ID (or create it if it doesn't exist)
		let checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// Tag the change set as a checkpoint
		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: newChangeSet.id,
				label_id: checkpointLabel.id,
			})
			.execute();

		// Create a discussion for this checkpoint if a message was provided
		if (message && message.trim() !== "") {
			// Use the createDiscussion utility from the lix-sdk
			await createDiscussion({
				lix: { db: trx },
				changeSet: { id: newChangeSet.id },
				firstComment: { content: message },
			});
		}

		return newChangeSet;
	});

	return changeSet;
};
