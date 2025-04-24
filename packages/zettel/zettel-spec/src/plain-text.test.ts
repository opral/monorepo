import { test, expect } from "vitest";
import { fromPlainText, toPlainText } from "./plain-text.js";
import type { ZettelDoc } from "./nodes/doc.js";

test("fromPlainText parses single and multiple lines", () => {
	const text = "Hello world\nSecond line";
	const doc = fromPlainText(text);

	expect(doc.type).toBe("zettel_doc");
	expect(doc.content).toBeDefined();
	expect(doc.content?.length).toBe(2);

	expect(doc.content?.[0]).toMatchObject({
		type: "zettel_paragraph",
		attrs: { zettel_key: expect.any(String) },
		content: [
			{
				type: "text",
				text: "Hello world",
			},
		],
	});

	expect(doc.content?.[1]).toMatchObject({
		type: "zettel_paragraph",
		attrs: { zettel_key: expect.any(String) },
		content: [
			{
				type: "text",
				text: "Second line",
			},
		],
	});
});

test("fromPlainText parses empty lines as paragraphs with empty content", () => {
	const text = "Hello world\n\nHow are you?";
	const doc = fromPlainText(text);

	expect(doc.type).toBe("zettel_doc");
	expect(doc.content).toBeDefined();
	expect(doc.content?.length).toBe(3);

	expect(doc.content?.[0]).toMatchObject({
		type: "zettel_paragraph",
		attrs: { zettel_key: expect.any(String) },
		content: [
			{
				type: "text",
				text: "Hello world",
			},
		],
	});

	expect(doc.content?.[1]).toMatchObject({
		type: "zettel_paragraph",
		attrs: { zettel_key: expect.any(String) },
		content: [],
	});

	expect(doc.content?.[2]).toMatchObject({
		type: "zettel_paragraph",
		attrs: { zettel_key: expect.any(String) },
		content: [
			{
				type: "text",
				text: "How are you?",
			},
		],
	});
});

test("toPlainText serializes Tiptap JSON doc", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: { zettel_key: "key1" },
				content: [{ type: "text", text: "First line." }],
			},
			{
				type: "zettel_paragraph",
				attrs: { zettel_key: "key2" },
				content: [],
			},
			{
				type: "zettel_paragraph",
				attrs: { zettel_key: "key3" },
				content: [
					{ type: "text", text: "Second " },
					{ type: "text", marks: [{ type: "bold" }], text: "bold" },
					{ type: "text", text: " line." },
				],
			},
		],
	};
	const expectedText = "First line.\n\nSecond bold line.";
	expect(toPlainText(doc)).toBe(expectedText);
});

test("fromPlainText handles empty input", () => {
	const doc = fromPlainText("");
	expect(doc).toEqual({
		type: "zettel_doc",
		content: [],
	});
});

test("toPlainText handles empty input", () => {
	const doc: ZettelDoc = { type: "zettel_doc", content: [] };
	expect(toPlainText(doc)).toBe("");
});
