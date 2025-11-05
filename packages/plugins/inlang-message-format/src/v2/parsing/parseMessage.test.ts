import { test, expect } from "vitest";
import { parseMessage } from "./parseMessage.js";

test("it parse a variable reference", async () => {
	const parsed = parseMessage({
		key: "test",
		value: "Hello {name}!",
		languageTag: "en",
	});

	expect(parsed).toStrictEqual({
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{ type: "Text", value: "Hello " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "!" },
				],
			},
		],
	});
});
