import { it, expect } from "vitest"
import { compileMessage } from "./compileMessage.js"

it.skip("should compile a message", () => {
	const result = compileMessage({
		id: "multipleParams",
		selectors: [],
		variants: [
			{
				match: {},
				languageTag: "en",
				pattern: [
					{
						type: "Text",
						value: "Hello ",
					},
					{
						type: "VariableReference",
						name: "name",
					},
					{
						type: "Text",
						value: "! You have ",
					},
					{
						type: "VariableReference",
						name: "count",
					},
					{
						type: "Text",
						value: " messages.",
					},
				],
			},
			{
				match: {},
				languageTag: "de",
				pattern: [
					{
						type: "Text",
						value: "Hallo ",
					},
					{
						type: "VariableReference",
						name: "name",
					},
					{
						type: "Text",
						value: "! Du hast ",
					},
					{
						type: "VariableReference",
						name: "count",
					},
					{
						type: "Text",
						value: " Nachrichten.",
					},
				],
			},
		],
	})
	expect(result)
		.toBe(`export const multipleParams = /** @param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params */ (params) => {
  const contents = {
  "en": \`Hello \${params.name}! You have \${params.count} messages.\`,
  "de": \`Hallo \${params.name}! Du hast \${params.count} Nachrichten.\`
  }
  return contents[languageTag()] ?? "multipleParams"
}`)
})
