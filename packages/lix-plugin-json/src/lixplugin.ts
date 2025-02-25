import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export const lixPluginJson: LixPlugin = {
	key: "lix_plugin_json",
	detectChangesGlob: "*.json",
	applyChanges,
	detectChanges,
};
