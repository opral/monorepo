import { test, expect } from "vitest";
import { accountMention, block, span } from "./builder.js";
import { serializeToText } from "./serialize-to-text.js";

test("serializes spans with no marks", () => {
	const ast = [
		block({
			style: "normal",
			children: [span({ text: "Hello world" })],
		}),
	];
	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello world");
});

test("serializes an account mention", () => {
	const ast = [
		block({
			style: "normal",
			children: [
				span({ text: "Hello " }),
				accountMention({ id: "47237hh8h4h75", name: "Developer" }),
			],
		}),
	];
	const serialized = serializeToText(ast);
	expect(serialized).toBe("Hello @Developer");
});
