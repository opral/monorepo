import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
// import initialDoc from "../assets/before.json?raw";
import { createCheckpointV2 } from "./utilities/createCheckpoint";

export const lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

await createCheckpointV2("initial checkpoint");

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
	})
	.onConflict((oc) => oc.doNothing())
	.returningAll()
	.executeTakeFirstOrThrow();

