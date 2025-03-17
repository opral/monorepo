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
