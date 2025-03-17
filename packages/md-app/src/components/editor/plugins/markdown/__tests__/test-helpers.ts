import { PlateEditor, createPlateEditor } from "@udecode/plate/react";
import { Descendant } from "@udecode/plate";
import { ExtendedMarkdownPlugin } from "../markdown-plugin";

/**
 * Creates a test editor instance with markdown plugin
 */
export function createTestEditor(): PlateEditor {
	return createPlateEditor({
		plugins: [ExtendedMarkdownPlugin],
	});
}

/**
 * Performs a roundtrip test: markdown -> editor -> markdown
 *
 * @param editor The plate editor instance
 * @param markdown The markdown string to test
 * @returns The markdown string after roundtrip
 */
export function roundtripMarkdown(
	editor: PlateEditor,
	markdown: string
): string {
	// Step 1: Deserialize markdown to editor value
	const editorValue = editor
		.getApi(ExtendedMarkdownPlugin)
		.markdown.deserialize(markdown);
	editor.children = editorValue;

	// Step 2: Serialize editor value back to markdown
	return editor.getApi(ExtendedMarkdownPlugin).markdown.serialize(editorValue);
}

/**
 * Deserializes markdown to editor value for inspection
 */
export function deserializeMarkdown(
	editor: PlateEditor,
	markdown: string
): Descendant[] {
	return editor.getApi(ExtendedMarkdownPlugin).markdown.deserialize(markdown);
}

/**
 * Serializes editor value to markdown
 */
export function serializeToMarkdown(
	editor: PlateEditor,
	value: Descendant[]
): string {
	editor.children = value;
	return editor.getApi(ExtendedMarkdownPlugin).markdown.serialize(value);
}

/**
 * Normalizes markdown strings for comparison by:
 * - Trimming whitespace
 * - Normalizing line endings
 * - Removing extra newlines
 *
 * @param markdown The markdown string to normalize
 * @returns Normalized markdown string
 */
export function normalizeMarkdown(markdown: string): string {
	return markdown
		.trim()
		.replace(/\r\n/g, "\n") // Normalize line endings
		.replace(/\n{3,}/g, "\n\n"); // Replace 3+ newlines with just 2
}

/**
 * Sample test cases from the gfm.md test file
 */
export const testCases = {
	heading: "# Heading 1\n## Heading 2\n### Heading 3",
	paragraph:
		"This is a paragraph with two sentences. Here is the second sentence.\n\nThis is another paragraph.",
	emphasis:
		"*Italic text* using asterisks.\n**Bold text** using double asterisks.\n~~Strikethrough~~ using tildes.",
	lists:
		"- Item 1\n- Item 2\n  - Subitem 2.1\n  - Subitem 2.2\n- Item 3\n\n1. First item\n2. Second item\n   1. Subitem 2.1\n   2. Subitem 2.2\n3. Third item",
	links: "[GitHub](https://github.com) is a popular platform for hosting code.",
	blockquotes:
		"> This is a blockquote. It can span multiple lines.\n>\n> - It supports lists.\n> - And other formatting.",
	codeBlocks:
		'```javascript\nconst message = "Hello, world!";\nconsole.log(message);\n```',
	horizontalRule: "---",
};
