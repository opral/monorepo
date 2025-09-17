import type { LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./apply-changes.js";
import { detectChanges } from "./detect-changes.js";
import { renderDiff } from "./render-diff.js";

export const plugin = {
	key: "plugin_md",
	detectChangesGlob: "*.md",
	detectChanges,
	renderDiff,
	applyChanges,
} as const;

plugin satisfies LixPlugin;
