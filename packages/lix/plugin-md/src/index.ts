import type { LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./apply-changes.js";
import { detectChanges } from "./detect-changes.js";

export const plugin = {
	key: "plugin_md",
	detectChangesGlob: "*.md",
	detectChanges,
	diffUiComponent: () => import("./diff.js").then((m) => m.DiffComponent),
	applyChanges,
} as const;

plugin satisfies LixPlugin;
