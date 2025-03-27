import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";
export { createDocDiff } from "./diffing/create-doc-diff.js";
export type { DiffNode, DiffState } from "./diffing/create-doc-diff.js";

export const plugin: LixPlugin = {
	key: "plugin_prosemirror",
	detectChangesGlob: "/prosemirror.json",
	detectChanges,
	applyChanges,
};

// Export the main functions for easier consumption by the UI
