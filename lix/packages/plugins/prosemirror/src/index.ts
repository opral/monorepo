import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export { lixProsemirror } from "./prosemirror/lix-plugin.js";
export { idPlugin } from "./prosemirror/id-plugin.js";

export const plugin: LixPlugin = {
	key: "plugin_prosemirror",
	detectChangesGlob: "/prosemirror.json",
	detectChanges,
	applyChanges,
};

