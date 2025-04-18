import { test, expect } from "vitest";
import { block, span, accountMention, link } from "./builder.js";

test("account mention and link", () => {
	const accountMentionDef = accountMention({ id: "47237hh8h4h75" });
	const linkDef = link({ href: "https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312" });

	const ast = [
		block({
			style: "normal",
			markDefs: [accountMentionDef, linkDef],
			children: [
				span({ text: "Hi " }),
				span({ text: "Developer", marks: [accountMentionDef._key] }),
				span({ text: ", have you seen " }),
				span({ text: "this", marks: [linkDef._key] }),
				span({ text: "?" }),
			],
		}),
	];

	const blockNode = ast[0]!;
	const mentionSpan = blockNode.children[1]!;
	const linkSpan = blockNode.children[3]!;
	const mentionMarkDef = blockNode.markDefs.find((m) => m._type === "accountMention")!;
	const linkMarkDef = blockNode.markDefs.find((m) => m._type === "link")!;
	const mentionMarkDefKey = mentionMarkDef._key;
	const linkMarkDefKey = linkMarkDef._key;

	expect(mentionMarkDefKey).toBe(mentionSpan.marks[0]);
	expect(linkMarkDefKey).toBe(linkSpan.marks[0]);

	expect(blockNode).toMatchObject({
		_type: "block",
		style: "normal",
		children: [
			{ _type: "span", text: "Hi ", _key: expect.any(String), marks: [] },
			{ _type: "span", text: "Developer", _key: expect.any(String), marks: [mentionMarkDefKey] },
			{ _type: "span", text: ", have you seen ", _key: expect.any(String), marks: [] },
			{ _type: "span", text: "this", _key: expect.any(String), marks: [linkMarkDefKey] },
			{ _type: "span", text: "?", _key: expect.any(String), marks: [] },
		],
		markDefs: [
			{ _type: "accountMention", _key: mentionMarkDefKey, id: "47237hh8h4h75" },
			{
				_type: "link",
				_key: linkMarkDefKey,
				href: "https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312",
			},
		],
	});
});
