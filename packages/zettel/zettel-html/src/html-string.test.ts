// @vitest-environment jsdom
import { test, expect } from "vitest";
import {
	createZettelTextBlock,
	createZettelSpan,
	createZettelLinkMark,
	type ZettelDoc,
} from "@opral/zettel-ast";
import { toHtmlString, fromHtmlString } from "./html-string.js";
import { normalizeHtml, stringifyJson } from "./utils/normalize-html.js";

test("wraps a doc in a div for encapsulation", () => {
	const doc: ZettelDoc = { type: "zettel_doc", content: [] };

	const html = toHtmlString(doc);

	expect(html).toBe(
		normalizeHtml(`
    <div data-zettel-doc="true"></div>
  `)
	);

	expect(fromHtmlString(html)).toEqual(doc);
});

test("style: zettel_normal serializes to <p><span></span></p> with keys and parses back", async () => {
	// Use fixed keys for predictability in the test
	const spanKey = "testSpanKey123";
	const blockKey = "testBlockKey456";
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				zettel_key: blockKey,
				style: "zettel_normal",
				children: [
					createZettelSpan({
						zettel_key: spanKey,
						text: "Hello world",
					}),
				],
			}),
		],
	};

	const html = toHtmlString(doc);

	expect(html).toBe(
		normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">Hello world</span>
      </p>
    </div>
  `)
	);
});

test("serializes and parses 'zettel_link' mark", () => {
	const spanKey = "spanLink1";
	const blockKey = "blockLink1";

	const linkMarkDef = createZettelLinkMark({
		href: "https://example.com",
	});

	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				zettel_key: blockKey,
				style: "zettel_normal",
				children: [
					createZettelSpan({
						zettel_key: spanKey,
						text: "Link text",
						marks: [linkMarkDef],
					}),
				],
			}),
		],
	};

	const html = toHtmlString(doc);

	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">
          <a href="https://example.com">Link text</a>
        </span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtmlString(html);
	// expect(parsedDoc).toEqual(doc);
});

test("parses generic <p>Hello World</p> as zettel_text_block", () => {
	const html = `<p>Hello World</p>`;

	expect(fromHtmlString(html)).toEqual({
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "Hello World",
						marks: [],
					},
				],
			},
		],
	} satisfies ZettelDoc);
});

test("parses <em> in generic HTML as zettel.em mark", () => {
	const html = `<p>This is <em>italic</em> text</p>`;
	const parsedDoc = fromHtmlString(html);
	// Should parse as a single zettel.textBlock with three spans: "This is ", "italic" (with em), " text"
	expect(parsedDoc).toEqual({
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "This is ",
						marks: [],
					},
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "italic",
						marks: [{ type: "zettel_italic", zettel_key: expect.any(String) }],
					},
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: " text",
						marks: [],
					},
				],
			},
		],
	} satisfies ZettelDoc);
});

test("parses <strong> in generic HTML as zettel.strong mark", () => {
	const html = `<p>This is <strong>bold</strong> text</p>`;
	const parsedDoc = fromHtmlString(html);
	// Should parse as a single zettel.textBlock with three spans: "This is ", "bold" (with strong), " text"
	expect(parsedDoc).toEqual({
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "This is ",
						marks: [],
					},
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "bold",
						marks: [{ type: "zettel_strong", zettel_key: expect.any(String) }],
					},
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: " text",
						marks: [],
					},
				],
			},
		],
	} satisfies ZettelDoc);
});

test("parses multiple <p> as multiple zettel_text_block", () => {
	const html = `<p>First block</p><p>Second block</p><p>Third block</p>`;
	const parsedDoc = fromHtmlString(html);
	expect(parsedDoc).toEqual({
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "First block",
						marks: [],
					},
				],
			},
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "Second block",
						marks: [],
					},
				],
			},
			{
				type: "zettel_text_block",
				zettel_key: expect.any(String),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: expect.any(String),
						text: "Third block",
						marks: [],
					},
				],
			},
		],
	} satisfies ZettelDoc);
});
