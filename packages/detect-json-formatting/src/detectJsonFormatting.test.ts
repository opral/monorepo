import { expect, it } from "vitest"
import { detectJsonFormatting } from "./detectJsonFormatting.js"

it("should detect spacing", () => {
	// test all possible spacings
	for (const spacing of [1, 2, 3, 4, 6, 8, "\t"]) {
		const withSpacing = `{\n${
			spacing === "\t" ? "\t" : " ".repeat(spacing as number)
		}"test": "test"\n}`
		const serialize = detectJsonFormatting(withSpacing)
		expect(serialize(JSON.parse(withSpacing))).toBe(withSpacing)
	}
})

it("should detect new lines correctly", () => {
	const withNewLine = `{"test":"test"}\n`
	const withoutNewLine = `{"test":"test"}`
	const withNewLineAndSpacing = `{\n\t"test": "test"\n}`

	const serialize1 = detectJsonFormatting(withNewLine)
	const serialize2 = detectJsonFormatting(withoutNewLine)
	const serialize3 = detectJsonFormatting(withNewLineAndSpacing)

	expect(serialize1(JSON.parse(withNewLine))).toBe(withNewLine)
	expect(serialize2(JSON.parse(withoutNewLine))).toBe(withoutNewLine)
	expect(serialize3(JSON.parse(withNewLineAndSpacing))).toBe(withNewLineAndSpacing)
})
