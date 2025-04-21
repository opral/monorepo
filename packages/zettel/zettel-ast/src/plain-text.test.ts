import { test, expect } from "vitest";
import {
	createZettelAcountMentionMarkDef,
	createZettelTextBlock,
	createZettelSpan,
} from "./builder.js";
import { toPlainText, fromPlainText } from "./plain-text.js";
import type { ZettelDoc } from "./schema.js";

test("serializes spans with no marks", () => {
	const doc: ZettelDoc = [
		createZettelTextBlock({
			style: "normal",
			children: [createZettelSpan({ text: "Hello world" })],
		}),
	];
	const serialized = toPlainText(doc);
	expect(serialized).toBe("Hello world");
});

test("serializes custom marks", () => {
	const accountMentionDef = createZettelAcountMentionMarkDef({ id: "47237hh8h4h75" });

	const doc: ZettelDoc = [
		createZettelTextBlock({
			style: "normal",
			markDefs: [accountMentionDef],
			children: [
				createZettelSpan({ text: "Hello " }),
				createZettelSpan({ text: "Developer", marks: [accountMentionDef._key] }),
			],
		}),
	];

	const serialized = toPlainText(doc);
	expect(serialized).toBe("Hello Developer");
});

test("fromPlainText parses single and multiple lines", () => {
	const text = "Hello world\nSecond line";
	const doc = fromPlainText(text);
	expect(doc.length).toBe(2);
	expect(doc[0]).toMatchObject({
		_type: "zettel.textBlock",
		_key: expect.any(String),
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: expect.any(String),
				text: "Hello world",
				marks: [],
			},
		],
	});
	expect(doc[1]).toMatchObject({
		_type: "zettel.textBlock",
		_key: expect.any(String),
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: expect.any(String),
				text: "Second line",
				marks: [],
			},
		],
	});
});

test("fromPlainText parses empty lines as empty text blocks", () => {
	const text = "Hello world\n\nHow are you?";
	const doc = fromPlainText(text);
	expect(doc.length).toBe(3);
	expect(doc[0]).toMatchObject({
		_type: "zettel.textBlock",
		_key: expect.any(String),
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: expect.any(String),
				text: "Hello world",
				marks: [],
			},
		],
	});
	expect(doc[1]).toMatchObject({
		_type: "zettel.textBlock",
		_key: expect.any(String),
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: expect.any(String),
				text: "",
				marks: [],
			},
		],
	});
	expect(doc[2]).toMatchObject({
		_type: "zettel.textBlock",
		_key: expect.any(String),
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: expect.any(String),
				text: "How are you?",
				marks: [],
			},
		],
	});
});
