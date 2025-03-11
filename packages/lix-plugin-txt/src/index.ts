import { type LixPlugin } from "@lix-js/sdk";
import { detectChanges } from "./detectChanges.js";
import { DiffComponent } from "./diff.js";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";

export const plugin: LixPlugin = {
	key: "lix_plugin_txt",
	// we use this for markdown now
	detectChangesGlob: "*.md",
	detectChanges,
	diffUiComponent: DiffComponent,
};

export { TextSchemaV1 } from "./schemas/text.js";
export { parseMdBlocks };
