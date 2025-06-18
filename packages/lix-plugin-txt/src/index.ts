import { type LixPlugin } from "@lix-js/sdk";
import { detectChanges } from "./detectChanges.js";
import { applyChanges } from "./applyChanges.js";
import { DiffComponent } from "./diff.js";

export const plugin: LixPlugin = {
	key: "plugin_txt",
	// we use this for markdown files now
	detectChangesGlob: "*.md",
	detectChanges,
	applyChanges,
	diffUiComponent: DiffComponent,
};

export { TextSchemaV1 } from "./schemas/text.js";
