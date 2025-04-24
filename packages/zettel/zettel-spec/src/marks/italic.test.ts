// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { Editor } from "@tiptap/core";
import { ZettelExtensions } from "../extensions.js";

// --- HTML Parsing/Serialization ---
describe("HTML Parsing and Serialization", () => {
	test("should parse/serialize <em> tags", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p>Hello <em>World</em></p>",
		});

		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello " },
			{ type: "text", marks: [{ type: "zettel_italic" }], text: "World" },
		]);
		expect(editor.getHTML()).toContain("<p>Hello <em>World</em></p>");
	});

	test("should handle multiple segments", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p><em>One</em> and <em>Two</em></p>",
		});
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", marks: [{ type: "zettel_italic" }], text: "One" },
			{ type: "text", text: " and " },
			{ type: "text", marks: [{ type: "zettel_italic" }], text: "Two" },
		]);
		expect(editor.getHTML()).toContain("<p><em>One</em> and <em>Two</em></p>");
	});
});

// --- Keyboard Shortcuts ---
describe("Keyboard Shortcuts (Mod-i)", () => {
	test("should toggle italic on selection", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p>Hello World</p>",
		});

		// Select "World"
		editor.commands.setTextSelection({ from: 7, to: 12 });

		// Turn on
		editor.commands.toggleItalic();

		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello " },
			{ type: "text", marks: [{ type: "zettel_italic" }], text: "World" },
		]);

		// Turn off
		editor.commands.toggleItalic();

		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello World" }, // Expect merged text node
		]);
	});

	test("should apply italic at cursor", () => {
		const initialDoc = {
			type: "zettel_doc",
			content: [
				{
					type: "zettel_paragraph",
					content: [{ type: "text", text: "Start " }],
				},
			],
		};

		const editor = new Editor({
			extensions: ZettelExtensions,
			content: initialDoc,
		});

		// Cursor position remains the same relative to the text content
		editor.commands.setTextSelection({ from: 7, to: 7 }); // Cursor after "Start "
		editor.commands.toggleItalic(); // Activate mark
		editor.commands.insertContent("italic");
		editor.commands.toggleItalic(); // Deactivate mark
		editor.commands.insertContent(" normal");

		// The assertion should now expect the initial space to be preserved
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Start " }, // Expect space to be preserved
			{ type: "text", marks: [{ type: "zettel_italic" }], text: "italic" },
			{ type: "text", text: " normal" },
		]);
	});
});
