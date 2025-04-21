import { test, expect, beforeEach } from "vitest";
import { createZettelTextBlock, createZettelSpan, createZettelLinkMarkDef } from "./builder.js";
import type { ZettelDoc } from "./schema.js";
import { toHtml, fromHtml } from "./html.js";
import { JSDOM } from "jsdom";

/**
 * Normalizes HTML by removing extra whitespace and escaping double quotes within specific JSON attributes.
 */
function normalizeHtml(html: string): string {
	// Remove extra whitespace between tags and leading/trailing whitespace
	return html.replace(/>\s+</g, "><").trim();
}

/**
 * Stringifies a value and escapes double quotes for safe embedding in an HTML attribute.
 * @param value The value to stringify.
 * @returns The stringified and escaped value.
 */
function stringifyJsonForHtmlAttribute(value: any): string {
	return JSON.stringify(value).replace(/"/g, "&quot;");
}

/**
 * Simulate document for element creation
 */
beforeEach(() => {
	const dom = new JSDOM();
	globalThis.document = dom.window.document;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Node = dom.window.Node;
});

test("wraps a doc in a div for encapsulation", () => {
	const doc: ZettelDoc = [];

	const html = toHtml(doc);

	expect(html).toBe(
		normalizeHtml(`
    <div data-zettel-doc="true"></div>
  `)
	);

	expect(fromHtml(html)).toEqual(doc);
});

test("style: zettel.normal serializes to <p><span></span></p> with keys and parses back", async () => {
	// Use fixed keys for predictability in the test
	const spanKey = "testSpanKey123";
	const blockKey = "testBlockKey456";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Hello world",
				}),
			],
		}),
	];

	const html = toHtml(doc);

	expect(html).toBe(
		normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">Hello world</span>
      </p>
    </div>
  `)
	);

	expect(fromHtml(html)).toEqual(doc);
});

test("serializes and parses 'strong' mark", () => {
	const spanKey = "spanStrong1";
	const blockKey = "blockStrong1";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Bold text",
					marks: ["zettel.strong"], // Add the mark
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const marksAttrValue = stringifyJsonForHtmlAttribute(["zettel.strong"]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}"><strong>Bold text</strong></span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("serializes and parses 'em' mark", () => {
	const spanKey = "spanEm1";
	const blockKey = "blockEm1";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Italic text",
					marks: ["zettel.em"],
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const marksAttrValue = stringifyJsonForHtmlAttribute(["zettel.em"]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}"><em>Italic text</em></span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("serializes and parses nested 'strong' and 'em' marks", () => {
	const spanKey = "spanStrongEm1";
	const blockKey = "blockStrongEm1";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Bold italic text",
					marks: ["zettel.strong", "zettel.em"], // Add both marks
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const marksAttrValue = stringifyJsonForHtmlAttribute(["zettel.strong", "zettel.em"]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}"><strong><em>Bold italic text</em></strong></span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("serializes and parses 'zettel.code' mark", () => {
	const spanKey = "spanCode1";
	const blockKey = "blockCode1";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Code text",
					marks: ["zettel.code"],
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const marksAttrValue = stringifyJsonForHtmlAttribute(["zettel.code"]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}"><code>Code text</code></span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("serializes and parses 'zettel.link' mark", () => {
	const spanKey = "spanLink1";
	const blockKey = "blockLink1";

	const linkMarkDef = createZettelLinkMarkDef({
		href: "https://example.com",
	});

	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			markDefs: [linkMarkDef],
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "Link text",
					marks: [linkMarkDef._key],
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const markDefsAttrValue = stringifyJsonForHtmlAttribute([linkMarkDef]);
	const marksAttrValue = stringifyJsonForHtmlAttribute([linkMarkDef._key]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}" data-zettel-mark-defs="${markDefsAttrValue}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}">
          <a href="https://example.com" data-zettel-mark-key="${linkMarkDef._key}">Link text</a>
        </span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("custom marks are serialized and parsed", () => {
	const spanKey = "spanCustom1";
	const blockKey = "blockCustom1";
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: blockKey,
			style: "zettel.normal",
			children: [
				createZettelSpan({
					_key: spanKey,
					text: "hello world",
					marks: ["custom.mark"],
				}),
			],
		}),
	];

	const html = toHtml(doc);

	const marksAttrValue = stringifyJsonForHtmlAttribute(["custom.mark"]);
	const expectedHtml = normalizeHtml(`
    <div data-zettel-doc="true">
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${marksAttrValue}">hello world</span>
      </p>
    </div>
  `);

	expect(html).toBe(expectedHtml);

	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual(doc);
});

test("parses generic <p>Hello World</p> as zettel.textBlock", () => {
	const html = `<p>Hello World</p>`;

	expect(fromHtml(html)).toEqual([
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "Hello World",
					marks: [],
				},
			],
		},
	] satisfies ZettelDoc);
});

test("parses <em> in generic HTML as zettel.em mark", () => {
	const html = `<p>This is <em>italic</em> text</p>`;
	const parsedDoc = fromHtml(html);
	// Should parse as a single zettel.textBlock with three spans: "This is ", "italic" (with em), " text"
	expect(parsedDoc).toEqual([
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "This is ",
					marks: [],
				},
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "italic",
					marks: ["zettel.em"],
				},
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: " text",
					marks: [],
				},
			],
		},
	] satisfies ZettelDoc);
});

test("parses <strong> in generic HTML as zettel.strong mark", () => {
	const html = `<p>This is <strong>bold</strong> text</p>`;
	const parsedDoc = fromHtml(html);
	// Should parse as a single zettel.textBlock with three spans: "This is ", "bold" (with strong), " text"
	expect(parsedDoc).toEqual([
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "This is ",
					marks: [],
				},
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "bold",
					marks: ["zettel.strong"],
				},
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: " text",
					marks: [],
				},
			],
		},
	]);
});

test("parses multiple <p> as multiple zettel.textBlock", () => {
	const html = `<p>First block</p><p>Second block</p><p>Third block</p>`;
	const parsedDoc = fromHtml(html);
	expect(parsedDoc).toEqual([
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "First block",
					marks: [],
				},
			],
		},
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "Second block",
					marks: [],
				},
			],
		},
		{
			_type: "zettel.textBlock",
			_key: expect.any(String),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: expect.any(String),
					text: "Third block",
					marks: [],
				},
			],
		},
	]);
});
