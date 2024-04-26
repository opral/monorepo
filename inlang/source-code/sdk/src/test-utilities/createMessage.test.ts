import { expect, test } from "vitest"
import { createMessage } from "./createMessage.js"

test("should create a simple message", () => {
	expect(
		createMessage("welcome", {
			de: "Hallo inlang",
		})
	).toMatchInlineSnapshot({
		id: "welcome",
		alias: {},
		inputs: [],
		translations: [
			{
				languageTag: "de",
				selectors: [],
				declarations: [],
				variants: [
					{
						match: [],
						pattern: [
							{
								type: "text",
								value: "Hallo inlang",
							},
						],
					},
				],
			},
		],
	})
})

test("should create a message with pattern", () => {
	expect(
		createMessage("greeting", {
			en: [
				{ type: "text", value: "Hi " },
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "name",
					},
				},
				{ type: "text", value: '"' },
			],
		})
	).toStrictEqual({
		alias: {},
		id: "greeting",
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "Hi ",
					},
					{
						name: "name",
						type: "VariableReference",
					},
					{
						type: "Text",
						value: '"',
					},
				],
			},
		],
	})
})

test("should create a message with a pattern", () => {
	expect(
		createMessage("welcome", {
			en: "hello inlang",
			de: [{ type: "text", value: "Hallo inlang" }],
		})
	).toStrictEqual({
		alias: {},
		id: "welcome",
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "hello inlang",
					},
				],
			},
			{
				languageTag: "de",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "Hallo inlang",
					},
				],
			},
		],
	})
})
