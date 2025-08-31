import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./apply-changes.js";
import { detectChanges } from "./detect-changes.js";

export const plugin: LixPlugin = {
	key: "plugin_md",
	detectChangesGlob: "*.md",
	detectChanges,
	applyChanges,
};
