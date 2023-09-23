import { it, expect } from "vitest"
import { compilePattern } from "./compilePattern.js"
import type { Pattern } from "@inlang/sdk"

it("should compile a text only pattern", () => {
	const pattern: Pattern = [{ type: "Text", value: "Hello" }]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`Hello`")
})

it("should compile a pattern with multiple VariableReference's", () => {
	const pattern: Pattern = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "name" },
		{ type: "Text", value: "! You have " },
		{ type: "VariableReference", name: "count" },
		{ type: "Text", value: " messages." },
	]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`Hello ${params.name}! You have ${params.count} messages.`")
})
