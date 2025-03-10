import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export const plugin: LixPlugin = {
	key: "lix_plugin_inlang",
	detectChangesGlob: "*.json",
	applyChanges,
	detectChanges,
};
