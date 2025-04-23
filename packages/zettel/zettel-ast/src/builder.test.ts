import { test, expect } from "vitest";
import { createZettelTextBlock, createZettelSpan, createZettelLink } from "./builder.js";

test("account mention and link", () => {
	const linkDef = createZettelLink({
		href: "https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312",
	});

	const ast = [
		createZettelTextBlock({
			style: "normal",
			markDefs: [linkDef],
			children: [
				createZettelSpan({ text: "Hi, have you seen " }),
				createZettelSpan({ text: "this", marks: [linkDef._key] }),
				createZettelSpan({ text: "?" }),
			],
		}),
	];

	const blockNode = ast[0]!;
	const linkSpan = blockNode.children[1]!;
	const linkMarkDef = blockNode.markDefs.find((m) => m._type === "zettel.link")!;
	const linkMarkDefKey = linkMarkDef._key;

	expect(linkMarkDefKey).toBe(linkSpan.marks[0]);

	expect(blockNode).toMatchObject({
		_type: "zettel.textBlock",
		style: "normal",
		children: [
			{ _type: "zettel.span", text: "Hi, have you seen ", _key: expect.any(String), marks: [] },
			{ _type: "zettel.span", text: "this", _key: expect.any(String), marks: [linkMarkDefKey] },
			{ _type: "zettel.span", text: "?", _key: expect.any(String), marks: [] },
		],
		markDefs: [
			{
				_type: "zettel.link",
				_key: linkMarkDefKey,
				href: "https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312",
			},
		],
	});
});
