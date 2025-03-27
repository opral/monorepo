import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export let lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

export const initialDoc = {
	type: "doc",
	content: [],
};