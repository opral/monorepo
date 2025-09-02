import { test, expect, describe } from "vitest";
import { handlePaste } from "./handle-paste";
import { Editor } from "@tiptap/core";
import { markdownWcExtensions } from "@opral/markdown-wc/tiptap";

function makeClipboardEvent(md: string): any {
	return {
		preventDefault: () => {},
		clipboardData: {
			getData: (type: string) => (type === "text/plain" ? md : ""),
		},
	};
}

function createEditor(initialContent?: any): Editor {
	return new Editor({
		extensions: markdownWcExtensions(),
		content: initialContent || { type: "doc", content: [] },
	});
}

describe("handlePaste - cursor position insertion", () => {
	test("inserts at beginning of document", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Existing content" }],
				},
			],
		});

		// Set cursor to beginning
		editor.commands.setTextSelection(1);

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("New text"),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("New text");
		expect(editor.getText()).toContain("Existing content");

		editor.destroy();
	});

	test("inserts at middle of paragraph", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
			],
		});

		// Set cursor after "Hello " (position 7)
		editor.commands.setTextSelection(7);

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("beautiful "),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("beautiful");

		editor.destroy();
	});

	test("inserts at end of document", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Existing content" }],
				},
			],
		});

		// Set cursor to end
		editor.commands.setTextSelection(editor.state.doc.content.size);

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("New paragraph"),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("New paragraph");

		editor.destroy();
	});

	test("inserts between paragraphs", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "First para" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Second para" }] },
			],
		});

		// Set cursor between paragraphs
		editor.commands.setTextSelection(12);

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("Middle para"),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("Middle para");

		editor.destroy();
	});
});

describe("handlePaste - selection replacement", () => {
	test("replaces single word selection", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Replace this word here" }],
				},
			],
		});

		// Select "this" (positions 9-13)
		editor.commands.setTextSelection({ from: 9, to: 13 });

		const ok = await handlePaste({ editor, event: makeClipboardEvent("that") });
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("that");
		expect(editor.getText()).not.toContain("this");

		editor.destroy();
	});

	test("replaces multi-line selection", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "Line one" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Line two" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Line three" }] },
			],
		});

		// Select "Line two" paragraph
		editor.commands.setTextSelection({ from: 10, to: 19 });

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("Replacement"),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("Replacement");
		expect(editor.getText()).not.toContain("Line two");

		editor.destroy();
	});

	test("replaces entire document selection", async () => {
		const editor = createEditor({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "Old content" }] },
			],
		});

		// Select all
		editor.commands.selectAll();

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent("# New Document\n\nCompletely new"),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("New Document");
		expect(editor.getText()).toContain("Completely new");
		expect(editor.getText()).not.toContain("Old content");

		editor.destroy();
	});
});

describe("handlePaste - edge cases", () => {
	test("returns false for empty clipboard data", async () => {
		const editor = createEditor();

		const ok = await handlePaste({ editor, event: makeClipboardEvent("") });
		expect(ok).toBe(false);

		editor.destroy();
	});

	test("handles complex markdown with lists", async () => {
		const editor = createEditor();
		const complexMd = `# Title

- Item 1
- Item 2
  - Nested item

1. Ordered item`;

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent(complexMd),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("Title");
		expect(editor.getText()).toContain("Item 1");
		expect(editor.getText()).toContain("Ordered item");

		editor.destroy();
	});

	test("handles markdown with code blocks", async () => {
		const editor = createEditor();
		const mdWithCode = `Here's some code:

\`\`\`javascript
function hello() {
  console.log("world");
}
\`\`\`

And inline \`code\` too.`;

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent(mdWithCode),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("hello");
		expect(editor.getText()).toContain("world");

		editor.destroy();
	});

	test("handles multiple paragraph paste", async () => {
		const editor = createEditor();
		const multiPara = `First paragraph.

Second paragraph.

Third paragraph with **bold** and *italic*.`;

		const ok = await handlePaste({
			editor,
			event: makeClipboardEvent(multiPara),
		});
		expect(ok).toBe(true);
		expect(editor.getText()).toContain("First paragraph");
		expect(editor.getText()).toContain("Second paragraph");
		expect(editor.getText()).toContain("Third paragraph");

		editor.destroy();
	});

	test("handles paste with no clipboardData", async () => {
		const editor = createEditor();
		const event = { preventDefault: () => {} };

		const ok = await handlePaste({ editor, event });
		expect(ok).toBe(false);

		editor.destroy();
	});

	test("handles paste with null getData", async () => {
		const editor = createEditor();
		const event = {
			preventDefault: () => {},
			clipboardData: { getData: null },
		};

		const ok = await handlePaste({ editor, event });
		expect(ok).toBe(false);

		editor.destroy();
	});
});
