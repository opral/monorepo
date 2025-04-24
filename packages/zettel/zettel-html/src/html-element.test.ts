import { test, expect, beforeEach } from "vitest";
import { createZettelTextBlock, createZettelSpan, createZettelLinkMark } from "@opral/zettel-ast";
import { singleNodeToHtmlElement } from "./html-element.js";
import type { ZettelDoc, ZettelTextBlock, ZettelSpan } from "@opral/zettel-ast";
import { JSDOM } from "jsdom";
import { normalizeHtml, stringifyJson } from "./utils/normalize-html.js";

beforeEach(() => {
	const dom = new JSDOM();
	globalThis.document = dom.window.document;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Node = dom.window.Node;
});

test("creates a <p> element for zettel.textBlock with one span (with and without children)", () => {
	const spanKey = "span1";
	const blockKey = "block1";
	const block: ZettelTextBlock = createZettelTextBlock({
		zettel_key: blockKey,
		style: "zettel_normal",
		children: [createZettelSpan({ zettel_key: spanKey, text: "Hello world" })],
	});

	// With children (default)
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(
			`<p data-zettel-key="${blockKey}"><span data-zettel-key="${spanKey}">Hello world</span></p>`
		)
	);

	// Without children
	const elemNoChildren = singleNodeToHtmlElement(block, { includeChildren: false });
	expect(normalizeHtml(elemNoChildren.outerHTML)).toBe(
		normalizeHtml(`<p data-zettel-key="${blockKey}"></p>`)
	);
});

test("creates a <span> with <strong> for zettel.bold mark", () => {
	const spanKey = "spanStrong1";
	const blockKey = "blockStrong1";
	const span: ZettelSpan = createZettelSpan({
		zettel_key: spanKey,
		text: "Bold text",
		marks: [{ type: "zettel_bold", zettel_key: "mark1" }],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		zettel_key: blockKey,
		style: "zettel_normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">
          <strong>Bold text</strong>
        </span>
      </p>
    `)
	);
});

test("creates a <span> with <em> for zettel_italic mark", () => {
	const spanKey = "spanEm1";
	const blockKey = "blockEm1";
	const span: ZettelSpan = createZettelSpan({
		zettel_key: spanKey,
		text: "Italic text",
		marks: [{ type: "zettel_italic", zettel_key: "mark2" }],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		zettel_key: blockKey,
		style: "zettel_normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(
			`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">
          <em>Italic text</em>
        </span>
      </p>
    `
		)
	);
});

test("creates a <span> with custom mark data attribute", () => {
	const spanKey = "spanCustom1";
	const blockKey = "blockCustom1";
	const span: ZettelSpan = createZettelSpan({
		zettel_key: spanKey,
		text: "hello world",
		marks: [{ type: "custom_mark", zettel_key: "mark3" }],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		zettel_key: blockKey,
		style: "zettel_normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}">
          hello world
        </span>
      </p>`)
	);
});

test("multiple blocks produce multiple elements", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				zettel_key: "b1",
				style: "zettel_normal",
				children: [createZettelSpan({ zettel_key: "s1", text: "A" })],
			}),
			createZettelTextBlock({
				zettel_key: "b2",
				style: "zettel_normal",
				children: [createZettelSpan({ zettel_key: "s2", text: "B" })],
			}),
		],
	};
	// @ts-expect-error
	const elems = doc.content.map(singleNodeToHtmlElement);
	expect(normalizeHtml(elems[0]?.outerHTML ?? "")).toBe(
		normalizeHtml(`
      <p data-zettel-key="b1">
        <span data-zettel-key="s1">A</span>
      </p>`)
	);
	expect(normalizeHtml(elems[1]?.outerHTML ?? "")).toBe(
		normalizeHtml(`
      <p data-zettel-key="b2">
        <span data-zettel-key="s2">B</span>
      </p>`)
	);
});
