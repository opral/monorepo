import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";
import { DiffComponent } from "./diff.js";
import { parseMarkdown } from "./utilities/parseMarkdown.js";
import { serializeMarkdown } from "./utilities/serializeMarkdown.js";

export const plugin: LixPlugin = {
	key: "lix_plugin_md",
	detectChangesGlob: "*.md",
	detectChanges,
	diffUiComponent: DiffComponent,
	applyChanges,
};

export { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
export { MarkdownRootSchemaV1 } from "./schemas/root.js";
export { parseMarkdown, serializeMarkdown };
export type { MdAst, MdAstNode } from "./utilities/parseMarkdown.js";
