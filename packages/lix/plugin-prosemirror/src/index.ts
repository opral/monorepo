import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export { lixProsemirror } from "./prosemirror/lix-plugin.js";
export { idPlugin } from "./prosemirror/id-plugin.js";

export const PLUGIN_KEY = "plugin_prosemirror";

export const plugin: LixPlugin = {
	key: PLUGIN_KEY,
	detectChangesGlob: "/prosemirror.json",
	detectChanges,
	applyChanges,
};
