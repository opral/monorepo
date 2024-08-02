import { describe, expect, it } from "vitest"
import patternToString from "./patternToString.js"
import type { Pattern } from "@inlang/sdk2"

describe("patternToString", () => {
	it("Should transform pattern to string", () => {
		const pattern: Pattern = [
			{
				type: "text",
				value: "Hello, ",
			},
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "name",
				},
			},
			{
				type: "text",
				value: "!",
			},
		]

		const text = patternToString({ pattern })

		const correspondingText = "Hello, {{name}}!"

		expect(text).toStrictEqual(correspondingText)
	})
})
