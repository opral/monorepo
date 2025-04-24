// @vitest-environment jsdom
import { test, expect } from "vitest";
import { normalizeHtml } from "../utils/normalize-html.js";
import type { ZettelDoc } from "./doc.js";
import { validateDoc } from "../validate-doc.js";
import { generateHTML, generateJSON } from "@tiptap/core";
import { ZettelExtensions } from "../extensions.js";

test("roundtrip serialize ↔ parse", () => {
	const input: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_paragraph",
				attrs: {
					zettel_key: "123456",
				},
				content: [
					{
						type: "text",
						text: "Hello World",
					},
				],
			},
		],
	};

	const html = generateHTML(input, ZettelExtensions);

	expect(normalizeHtml(html)).toBe(
		normalizeHtml(`
		<p data-zettel-key="123456">Hello World</p>
	`)
	);

	const parsed = generateJSON(html, ZettelExtensions);
	expect(parsed).toEqual(input);

	const valid = validateDoc(parsed);
	expect(valid.errors).toBeUndefined();
});
