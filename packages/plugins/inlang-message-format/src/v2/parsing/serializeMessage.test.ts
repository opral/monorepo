// @ts-nocheck

import { test, expect } from "vitest";
import { serializeMessage } from "./serializeMessage.js";

test("it should split the variants into language tags", async () => {
	const message: Message = {
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{
				match: [],
				languageTag: "en",
				pattern: [{ type: "Text", value: "Hello" }],
			},
			{
				match: [],
				languageTag: "de",
				pattern: [{ type: "Text", value: "Hallo" }],
			},
		],
	};
	const serialized = serializeMessage(message);
	expect(serialized).toEqual({
		en: "Hello",
		de: "Hallo",
	});
});

test("it should throw if there are multiple variants for the same language tag which is unsupported at the moment", async () => {
	const message: Message = {
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{
				match: ["female"],
				languageTag: "en",
				pattern: [{ type: "Text", value: "Hello actress" }],
			},
			{
				match: [],
				languageTag: "en",
				pattern: [{ type: "Text", value: "Hallo actor" }],
			},
		],
	};
	expect(() => serializeMessage(message)).toThrow();
});
