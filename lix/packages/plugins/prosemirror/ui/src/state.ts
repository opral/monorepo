import { Change, openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export let lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

// store all changes
export let changes: Array<Change & { content: any }> = [];

// store checkpoints (change sets with checkpoint label)
export let checkpoints: Array<{
	id: string;
	created_at: string;
	changes: Array<Change & { content: any }>;
}> = [];

export let prosemirrorDocument: any =
	// initial document defaults to empty document
	{
		type: "doc",
		content: [],
	};

/**
 * Lix does not have subscriptions yet.
 * https://github.com/opral/lix-sdk/issues/262
 */
export const pollingInterval = 250;

// running all queries in the same interval
// note: this is done on purpose to avoid adopting a state
// management solution which would complicate the example
setInterval(async () => {
	// QUERYING CHANGES
	changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.selectAll("change")
		.select("snapshot.content")
		.orderBy("change.created_at", "desc")
		.execute();

	// QUERYING CHECKPOINTS
	try {
		// 1. Get all change sets with checkpoint label
		const checkpointSets = await lix.db
			.selectFrom("change_set")
			.innerJoin(
				"change_set_label",
				"change_set.id",
				"change_set_label.change_set_id",
			)
			.innerJoin("label", "change_set_label.label_id", "label.id")
			.where("label.name", "=", "checkpoint")
			.select("change_set.id")
			.execute();

		// 2. For each checkpoint set, get its entity changes and derive creation time
		const checkpointResults = await Promise.all(
			checkpointSets.map(async (set) => {
				// Get entity changes for this checkpoint
				const setChanges = await lix.db
					.selectFrom("change")
					.innerJoin(
						"change_set_element",
						"change.id",
						"change_set_element.change_id",
					)
					.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
					.where("change_set_element.change_set_id", "=", set.id)
					.selectAll("change")
					.select("snapshot.content")
					.orderBy("change.created_at", "desc")
					.execute();

				// Use the newest change timestamp as the checkpoint creation time
				// (using the change most recently created - first in our sorted results)
				const timestamp = setChanges.length > 0
					? setChanges[0].created_at
					: new Date().toISOString();

				return {
					id: set.id,
					created_at: timestamp,
					changes: setChanges,
				};
			}),
		);
		
		// Sort checkpoints by their derived timestamps (newest first)
		checkpointResults.sort((a, b) => 
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
		
		checkpoints = checkpointResults;
	} catch (error) {
		console.error("Error fetching checkpoints:", error);
		// Keep existing checkpoints if there's an error
	}
}, pollingInterval);