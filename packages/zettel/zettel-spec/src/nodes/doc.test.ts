// @vitest-environment jsdom
import { test, expect } from "vitest";
import type { ZettelDoc } from "./doc.js";
import { validateDoc } from "../validate-doc.js";
import { generateHTML, generateJSON } from "@tiptap/core";
import { ZettelExtensions } from "../extensions.js";
import { normalizeHtml } from "../utils/normalize-html.js";

test("roundtrip html", async () => {
	const input: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "123456",
				},
			},
		],
	};

	const html = generateHTML(input, ZettelExtensions);

	// given that the doc node is the top node,
	// the content is expected to be the first paragraph
	expect(normalizeHtml(html)).toBe(
		normalizeHtml(`
		<p data-zettel-key="123456"></p>
	`)
	);

	const parsed = generateJSON(html, ZettelExtensions);
	expect(parsed).toEqual(input);

	const valid = validateDoc(parsed);
	expect(valid.errors).toBeUndefined();
});

test("empty document passes", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [],
	};
	const result = validateDoc(doc);
	expect(result.errors).toBeUndefined();
});

test("invalid document type fails", () => {
	const doc: ZettelDoc = {
		// @ts-expect-error - invalid document type
		type: "doc",
		content: [],
	};
	const result = validateDoc(doc);
	expect(result.errors).toBeDefined();
});

test("paragraph passes", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "uniqueKey",
				},
				content: [
					{
						type: "text",
						text: "Hello world",
					},
				],
			},
		],
	};
	const result = validateDoc(doc);
	expect(result.errors).toBeUndefined();
});

test("undefined attrs.zettel_key fails", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				// @ts-expect-error - missing required attribute
				attrs: {},
				content: [
					{
						type: "text",
						text: "Hello world",
					},
				],
			},
		],
	};
	const result = validateDoc(doc);
	expect(result.errors).toBeDefined();
});

test("attrs.zettel_key requires at least 6 characters to minimize collisions", () => {
	const fails: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "12345",
				},
			},
		],
	};
	expect(validateDoc(fails).errors).toBeDefined();

	const succeeds: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "123456",
				},
			},
			{
				type: "custom_video_viewer",
				attrs: {
					zettel_key: "123456",
				},
			},
		],
	};
	expect(validateDoc(succeeds).errors).toBeUndefined();
});
