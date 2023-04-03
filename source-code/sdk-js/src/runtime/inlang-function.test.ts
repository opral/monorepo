import { createInlangFunction } from "./inlang-function.js"
import { test, describe, expect } from "vitest"
import type { Resource } from "@inlang/core/ast"

const resource = {
	type: "Resource",
	languageTag: {
		type: "LanguageTag",
		name: "en",
	},
	body: [
		{
			type: "Message",
			id: {
				type: "Identifier",
				name: "hello",
			},
			pattern: {
				type: "Pattern",
				elements: [{ type: "Text", value: "world" }],
			},
		},
		{
			type: "Message",
			id: {
				type: "Identifier",
				name: "welcome",
			},
			pattern: {
				type: "Pattern",
				elements: [
					{ type: "Text", value: "Welcome, " },
					{
						type: "Placeholder",
						placeholder: {
							type: "Expression",
							expression: {
								type: "Variable",
								name: "name",
							},
						},
					},
					{ type: "Text", value: "!" },
				],
			},
		},
	],
} satisfies Resource

describe("createInlangFunction", () => {
	test("it should resolve the message", () => {
		const fn = createInlangFunction(resource)

		const result = fn("hello")

		expect(result).toBe("world")
	})

	test("it should resolve the message with placeholder", () => {
		const fn = createInlangFunction(resource)

		const result = fn("welcome", { name: "Inlang" })

		expect(result).toBe("Welcome, Inlang!")
	})

	test("it should return an empty string for a placeholder if placeholder does not get passed as args", () => {
		const fn = createInlangFunction(resource)

		const result = fn("welcome", {})

		expect(result).toBe("Welcome, !")
	})

	test("it should return an empty string if key does not exist in resource", () => {
		const fn = createInlangFunction(resource)

		const result = fn("missing-key")

		expect(result).toBe("")
	})
})
