import { createCheckpoint, openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import { initLixInspector } from "@lix-js/inspector";

export const lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

// dev tool for debugging
initLixInspector({ lix });

await createCheckpoint({ lix });

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
