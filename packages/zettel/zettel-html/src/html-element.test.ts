import { test, expect, beforeEach } from "vitest";
import { createZettelTextBlock, createZettelSpan, createZettelLink } from "@opral/zettel-ast";
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
		_key: blockKey,
		style: "zettel.normal",
		children: [createZettelSpan({ _key: spanKey, text: "Hello world" })],
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

test("creates a <span> with <strong> for zettel.strong mark", () => {
	const spanKey = "spanStrong1";
	const blockKey = "blockStrong1";
	const span: ZettelSpan = createZettelSpan({
		_key: spanKey,
		text: "Bold text",
		marks: ["zettel.strong"],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		_key: blockKey,
		style: "zettel.normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${stringifyJson(["zettel.strong"])}">
          <strong>Bold text</strong>
        </span>
      </p>
    `)
	);
});

test("creates a <span> with <em> for zettel.em mark", () => {
	const spanKey = "spanEm1";
	const blockKey = "blockEm1";
	const span: ZettelSpan = createZettelSpan({
		_key: spanKey,
		text: "Italic text",
		marks: ["zettel.em"],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		_key: blockKey,
		style: "zettel.normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(
			`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${stringifyJson(["zettel.em"])}">
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
		_key: spanKey,
		text: "hello world",
		marks: ["custom.mark"],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		_key: blockKey,
		style: "zettel.normal",
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(`
      <p data-zettel-key="${blockKey}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${stringifyJson(["custom.mark"])}">
          hello world
        </span>
      </p>`)
	);
});

test("creates <a> for zettel.link mark with markDef", () => {
	const spanKey = "spanLink1";
	const blockKey = "blockLink1";
	const linkMarkDef = createZettelLink({ _key: "linkDef1", href: "https://example.com" });
	const span: ZettelSpan = createZettelSpan({
		_key: spanKey,
		text: "Link text",
		marks: ["linkDef1"],
	});
	const block: ZettelTextBlock = createZettelTextBlock({
		_key: blockKey,
		style: "zettel.normal",
		markDefs: [linkMarkDef],
		children: [span],
	});
	const elem = singleNodeToHtmlElement(block);
	expect(normalizeHtml(elem.outerHTML)).toBe(
		normalizeHtml(
			`<p data-zettel-key="${blockKey}" data-zettel-mark-defs="${stringifyJson([linkMarkDef])}">
        <span data-zettel-key="${spanKey}" data-zettel-marks="${stringifyJson(["linkDef1"])}">
          <a href="https://example.com" data-zettel-mark-key="linkDef1">Link text</a>
        </span>
      </p>`
		)
	);
});

test("multiple blocks produce multiple elements", () => {
	const doc: ZettelDoc = [
		createZettelTextBlock({
			_key: "b1",
			style: "zettel.normal",
			children: [createZettelSpan({ _key: "s1", text: "A" })],
		}),
		createZettelTextBlock({
			_key: "b2",
			style: "zettel.normal",
			children: [createZettelSpan({ _key: "s2", text: "B" })],
		}),
	];
	// @ts-expect-error
	const elems = doc.map(singleNodeToHtmlElement);
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
