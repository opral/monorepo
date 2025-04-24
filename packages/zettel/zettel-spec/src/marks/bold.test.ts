// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { Editor } from "@tiptap/core";
import { ZettelExtensions } from "../extensions.js"; // Make sure BoldMark is included here

// --- Parsing (implicitly via content initialization) ---
describe("Parsing from HTML Input", () => {
	test("should parse <strong> tags", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p>Hello <strong>World</strong></p>", // Input is HTML
		});
		// Assert only against the resulting JSON AST
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello " },
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "World" },
		]);
	});

	test("should handle multiple segments", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p><strong>One</strong> and <strong>Two</strong></p>",
		});
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "One" },
			{ type: "text", text: " and " },
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "Two" },
		]);
	});
});

// --- Keyboard Shortcuts ---
describe("Keyboard Shortcuts (Mod-b)", () => {
	test("should toggle bold on selection", () => {
		const editor = new Editor({
			extensions: ZettelExtensions,
			content: "<p>Hello World</p>", // Initialize with HTML
		});

		// Select "World"
		editor.commands.setTextSelection({ from: 7, to: 12 });

		// Turn on
		editor.commands.toggleBold();

		// Assert JSON AST
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello " },
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "World" },
		]);

		// Turn off
		editor.commands.toggleBold();

		// Assert JSON AST
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Hello World" }, // Expect merged text node
		]);
	});

	test("should apply bold at cursor", () => {
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
			content: initialDoc, // Initialize with JSON
		});

		// Cursor position at the end of "Start "
		editor.commands.setTextSelection(7); // Position after the space

		// Toggle bold on (activates mark for next input)
		editor.commands.toggleBold();

		// Type something
		editor.commands.insertContent("BoldText");

		// Assert JSON AST
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Start " },
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "BoldText" },
		]);

		// Toggle bold off
		editor.commands.toggleBold();
		editor.commands.insertContent(" NotBold");

		// Assert final JSON AST
		expect(editor.getJSON().content?.[0]?.content).toEqual([
			{ type: "text", text: "Start " },
			{ type: "text", marks: [{ type: "zettel_bold" }], text: "BoldText" },
			{ type: "text", text: " NotBold" },
		]);
	});
});
