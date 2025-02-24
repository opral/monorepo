import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
export const plugin: LixPlugin = {
	key: "lix_plugin_inlang",
	// NOTE @samuelstroschein should this be inlang?
	detectChangesGlob: "*.sqlite",
	// detectChanges,
	// diffUiComponent: DiffComponent,
	applyChanges,
};
