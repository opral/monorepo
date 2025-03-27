import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import before from "../assets/before.json?raw";

export let lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

export const initialDoc = JSON.parse(before);