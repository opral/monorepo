import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import initialDoc from "../assets/before.json?raw";
import { createCheckpointV2 } from "./utilities/createCheckpoint";

export const lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

// Insert the initial document if it doesn't exist
export const prosemirrorFile = await lix.db
	.insertInto("file")
	.values({
		path: "/prosemirror.json",
		data: new TextEncoder().encode(
			JSON.stringify({
				type: "doc",
				content: [],
			}),
		),
		// data: new TextEncoder().encode(initialDoc),
	})
	.onConflict((oc) => oc.doNothing())
	.returningAll()
	.executeTakeFirstOrThrow();

await createCheckpointV2("imported the initial before.json document");