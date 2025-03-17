import { Change, openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export let lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

/**
 * Lix does not have subscriptions yet.
 * https://github.com/opral/lix-sdk/issues/262
 */
export const pollingInterval = 250;

export let changes: Array<Change & { content: any }> = [];

setInterval(async () => {
	changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.selectAll("change")
		.select("snapshot.content")
		.execute();
}, pollingInterval);

export let prosemirrorDocument: any =
	// initial document defaults to empty document
	{
		type: "doc",
		content: [],
	};

setInterval(async () => {
	const blob = await lix.db
		.selectFrom("file")
		.where("file.path", "=", "/prosemirror.json")
		.select("data")
		.executeTakeFirst();

	if (blob) {
		prosemirrorDocument = JSON.parse(new TextDecoder().decode(blob.data));
	}
}, pollingInterval);