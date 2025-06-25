import { test, expect } from "vitest";
import { createZettelTextBlock, createZettelSpan, createZettelLinkMark } from "./builder.js";
import type { ZettelDoc } from "./schema.js";

test("links", () => {
	const linkMark = createZettelLinkMark({
		href: "https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312",
	});

	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			createZettelTextBlock({
				style: "normal",
				children: [
					createZettelSpan({ text: "Hi, have you seen " }),
					createZettelSpan({ text: "this", marks: [linkMark] }),
					createZettelSpan({ text: "?" }),
				],
			}),
		],
	};

	expect(doc).toMatchObject({
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				style: "normal",
				children: [
					{ type: "zettel_span", text: "Hi, have you seen ", marks: [] },
					{ type: "zettel_span", text: "this", marks: [linkMark] },
					{ type: "zettel_span", text: "?", marks: [] },
				],
			},
		],
	});
});
