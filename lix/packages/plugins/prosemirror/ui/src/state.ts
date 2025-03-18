import { Change, openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export let lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

// store all changes
export let changes: Array<Change & { content: any }> = [];

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
}, pollingInterval);
