import { test, expect } from "vitest";
import { accountMention, textBlock, span, link } from "./builder.js";
import { serializeToText } from "./serialize-to-text.js";

test("serializes spans with no marks", () => {
	const ast = [
		textBlock({
			style: "normal",
			children: [span({ text: "Hello world" })],
		}),
	];
	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello world");
});

test("serializes an account mention", () => {
	const accountMentionDef = accountMention({ id: "47237hh8h4h75" });

	const ast = [
		textBlock({
			style: "normal",
			markDefs: [accountMentionDef],
			children: [
				span({ text: "Hello " }),
				span({ text: "Developer", marks: [accountMentionDef._key] }),
			],
		}),
	];
	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello Developer");
});
