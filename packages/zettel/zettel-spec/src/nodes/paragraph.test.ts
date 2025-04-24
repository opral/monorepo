// @vitest-environment jsdom
import { test, expect } from "vitest";
import { Schema, DOMSerializer, DOMParser } from "prosemirror-model";
import { ZettelParagraphSpec } from "./paragraph.js";
import { normalizeHtml } from "../utils/normalize-html.js";
import { ZettelSchema } from "./prosemirror.js";
import type { ZettelDoc } from "./doc.js";
import { validateDoc } from "./validate-doc.js";

test("roundtrip serialize ↔ parse", () => {
	const schema = new ZettelSchema({});
	const original = schema.nodes.zettel_paragraph.create({}, schema.text("Hello World"));
	const serializer = DOMSerializer.fromSchema(schema);
	const dom = serializer.serializeNode(original) as Element;

	expect(normalizeHtml(dom.outerHTML)).toBe(
		normalizeHtml(`
		<p>Hello World</p>
	`)
	);

	const parsedDoc = DOMParser.fromSchema(schema).parse(dom);
	const round = parsedDoc.firstChild;
	expect(round?.type.name).toBe("zettel_paragraph");
	expect(round?.textContent).toBe("Hello World");
	expect(round?.eq(original)).toBe(true);
});

test("passes json schema validation", () => {
	const doc: ZettelDoc = {
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
	const result = validateDoc(doc);
	expect(result.errors).toBeUndefined();
});
