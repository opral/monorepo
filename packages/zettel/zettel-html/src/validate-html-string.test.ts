import { test, expect, beforeEach } from "vitest";
import { validateHtmlString } from "./validate-html-string.js";
import { JSDOM } from "jsdom";

beforeEach(() => {
	const dom = new JSDOM();
	globalThis.document = dom.window.document;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Node = dom.window.Node;
});

test("no root div fails", () => {
	const result = validateHtmlString("<p>Hello world</p>");

	expect(result).toEqual({
		success: false,
		data: undefined,
		errors: expect.arrayContaining([
			{ message: "Missing root div with data-zettel-doc attribute" },
		]),
	});
});

test("an empty doc passes", () => {
	const result = validateHtmlString(`
    <div data-zettel-doc="true"></div>
  `);

	expect(result).toEqual({
		success: true,
		data: expect.any(String),
		errors: undefined,
	});
});

test("textBlock with one span passes", () => {
	const result = validateHtmlString(`
    <div data-zettel-doc="true">
      <p data-zettel-key="block1">
        <span data-zettel-key="span1">Hello world</span>
      </p>
    </div>
  `);

	expect(result).toEqual({
		success: true,
		data: expect.any(String),
		errors: undefined,
	});
});

test("irrelevant attributes are ignored", () => {
	const result = validateHtmlString(`
    <div data-zettel-doc="true" data-custom="true" style="color: red">
      <p data-zettel-key="block1" data-custom="true" style="color: blue">
        <span data-zettel-key="span1" data-custom="true" style="color: green">Hello world</span>
      </p>
    </div>
  `);

	expect(result).toEqual({
		success: true,
		data: expect.any(String),
		errors: undefined,
	});
});

test("multiple textBlocks pass", () => {
	const result = validateHtmlString(`
    <div data-zettel-doc="true">
      <p data-zettel-key="block1">
        <span data-zettel-key="span1">Hello world</span>
      </p>
      <p data-zettel-key="block2">
        <span data-zettel-key="span2">Hello world</span>
      </p>
    </div>
  `);

	expect(result).toEqual({
		success: true,
		data: expect.any(String),
		errors: undefined,
	});
});
