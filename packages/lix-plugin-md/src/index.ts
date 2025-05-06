import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";
import { DiffComponent } from "./diff.js";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";

export const plugin: LixPlugin = {
	key: "lix_plugin_md",
	detectChangesGlob: "*.md",
	detectChanges,
	diffUiComponent: DiffComponent,
	applyChanges,
};

export { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";
export { parseMdBlocks };
