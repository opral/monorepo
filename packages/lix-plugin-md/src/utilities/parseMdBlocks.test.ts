import { expect, test } from "vitest";
import { parseMdBlocks } from "./parseMdBlocks.js";

test("it parses markdown blocks with ids", () => {
	const markdown = `<!-- id: PoL2_UoZI4 -->
# Playground
<!-- id: NBl5hBvm3l -->
A rich-text editor with AI capabilities. Try the **AI commands** or use  \`Cmd+J\` to open the AI menu.`;
	const blocks = parseMdBlocks(new TextEncoder().encode(markdown));
	expect(blocks).toEqual([
		{
			id: "PoL2_UoZI4",
			content: "# Playground",
			type: "heading",
		},
		{
			id: "NBl5hBvm3l",
			content:
				"A rich-text editor with AI capabilities. Try the **AI commands** or use  `Cmd+J` to open the AI menu.",
			type: "paragraph",
		},
	]);
});

test("it parses markdown blocks and create ids", () => {
	const markdown = `# Playground
A rich-text editor with AI capabilities. Try the **AI commands** or use  \`Cmd+J\` to open the AI menu.`;
	const blocks = parseMdBlocks(new TextEncoder().encode(markdown));
	expect(blocks).toEqual([
		{
			id: expect.any(String),
			content: "# Playground",
			type: "heading",
		},
		{
			id: expect.any(String),
			content:
				"A rich-text editor with AI capabilities. Try the **AI commands** or use  `Cmd+J` to open the AI menu.",
			type: "paragraph",
		},
	]);
});

test("it ignores non-ID comments", () => {
	const markdown = `<!-- some other comment -->
# Playground
<!-- id: abc123 -->
A test paragraph.`;
	const blocks = parseMdBlocks(new TextEncoder().encode(markdown));

	expect(blocks).toEqual([
		{
			id: expect.any(String), // Should be generated for the heading
			content: "# Playground",
			type: "heading",
		},
		{
			id: "abc123",
			content: "A test paragraph.",
			type: "paragraph",
		},
	]);
});

test("it correctly assigns IDs when there are consecutive ID comments", () => {
	const markdown = `<!-- id: abc123 -->
<!-- id: def456 -->
A test paragraph.`;
	const blocks = parseMdBlocks(new TextEncoder().encode(markdown));

	expect(blocks).toEqual([
		{
			id: "def456", // Last ID should be assigned to the paragraph
			content: "A test paragraph.",
			type: "paragraph",
		},
	]);
});

test("it assigns new IDs to unmarked blocks", () => {
	const markdown = `# Heading
A paragraph without an ID.`;
	const blocks = parseMdBlocks(new TextEncoder().encode(markdown));

	expect(blocks).toEqual([
		{
			id: expect.any(String),
			content: "# Heading",
			type: "heading",
		},
		{
			id: expect.any(String),
			content: "A paragraph without an ID.",
			type: "paragraph",
		},
	]);
});

test("it handles Unicode characters without throwing errors", () => {
	const markdown = `# Testing Unicode 🚀

This contains emojis 😀 and other Unicode: ñáéíóú

<!-- id: test123 -->
A paragraph with special chars: ©®™ and Chinese: 你好世界`;

	// Should not throw an error
	expect(() => {
		const blocks = parseMdBlocks(new TextEncoder().encode(markdown));
		expect(blocks).toHaveLength(3);
		expect(blocks[0]!.content).toBe("# Testing Unicode 🚀");
		expect(blocks[1]!.content).toBe(
			"This contains emojis 😀 and other Unicode: ñáéíóú",
		);
		expect(blocks[2]!.id).toBe("test123");
		expect(blocks[2]!.content).toBe(
			"A paragraph with special chars: ©®™ and Chinese: 你好世界",
		);
	}).not.toThrow();
});
