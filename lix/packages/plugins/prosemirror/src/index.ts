import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";
import type { ProsemirrorNode } from "./detectChanges.js";

export const plugin: LixPlugin = {
	key: "plugin_prosemirror",
	detectChangesGlob: "/prosemirror.json",
	detectChanges,
	applyChanges,
};

// Export the main functions for easier consumption by the UI
export { detectChanges, applyChanges };
export type { ProsemirrorNode };
