import { test, expect } from "vitest";
import { createZettelTextBlock, createZettelSpan } from "./builder.js";
import { toPlainText, fromPlainText } from "./plain-text.js";
import type { ZettelNode, ZettelDoc } from "./schema.js";

test("serializes spans with no marks", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				style: "normal",
				children: [createZettelSpan({ text: "Hello world" })],
			}),
		],
	};
	const serialized = toPlainText(doc);
	expect(serialized).toBe("Hello world");
});

test("serializes custom marks", () => {
	const customMark: ZettelNode = {
		type: "custom.accountMention",
		zettel_key: "47237hh8h4h75",
		id: "blabla",
	};

	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				style: "normal",
				children: [
					createZettelSpan({ text: "Hello " }),
					createZettelSpan({ text: "Developer", marks: [customMark] }),
				],
			}),
		],
	};

	const serialized = toPlainText(doc);
	expect(serialized).toBe("Hello Developer");
});

test("fromPlainText parses single and multiple lines", () => {
	const text = "Hello world\nSecond line";
	const doc = fromPlainText(text);
	expect(doc.content.length).toBe(2);
	expect(doc.content[0]).toMatchObject({
		type: "zettel_text_block",
		zettel_key: expect.any(String),
		style: "zettel_normal",
		children: [
			{
				type: "zettel_span",
				zettel_key: expect.any(String),
				text: "Hello world",
				marks: [],
			},
		],
	});
	expect(doc.content[1]).toMatchObject({
		type: "zettel_text_block",
		zettel_key: expect.any(String),
		style: "zettel_normal",
		children: [
			{
				type: "zettel_span",
				zettel_key: expect.any(String),
				text: "Second line",
				marks: [],
			},
		],
	});
});

test("fromPlainText parses empty lines as empty text blocks", () => {
	const text = "Hello world\n\nHow are you?";
	const doc = fromPlainText(text);
	expect(doc.content.length).toBe(3);
	expect(doc.content[0]).toMatchObject({
		type: "zettel_text_block",
		zettel_key: expect.any(String),
		style: "zettel_normal",
		children: [
			{
				type: "zettel_span",
				zettel_key: expect.any(String),
				text: "Hello world",
				marks: [],
			},
		],
	});
	expect(doc.content[1]).toMatchObject({
		type: "zettel_text_block",
		zettel_key: expect.any(String),
		style: "zettel_normal",
		children: [
			{
				type: "zettel_span",
				zettel_key: expect.any(String),
				text: "",
				marks: [],
			},
		],
	});
	expect(doc.content[2]).toMatchObject({
		type: "zettel_text_block",
		zettel_key: expect.any(String),
		style: "zettel_normal",
		children: [
			{
				type: "zettel_span",
				zettel_key: expect.any(String),
				text: "How are you?",
				marks: [],
			},
		],
	});
});
