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

it("should throw if an unknown expression is used", () => {
	const pattern: Pattern = [
		{ type: "Text", value: "Hello " },
		// @ts-expect-error - unknown type
		{ type: "Unknown", value: "unknown" },
	]
	expect(() => compilePattern(pattern)).toThrow()
})

it("should escape backticks", () => {
	const pattern: Pattern = [{ type: "Text", value: "`Hello world`" }]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`\\`Hello world\\``")
})

it("should escape backslashes", () => {
	const pattern: Pattern = [{ type: "Text", value: "\\Hello world\\" }]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`\\\\Hello world\\\\`")
})

it("should escape escaped backticks", () => {
	const pattern: Pattern = [{ type: "Text", value: "\\`Hello world\\`" }]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`\\\\\\`Hello world\\\\\\``")
})

it("should escape variable interpolation ( ${} )", () => {
	const pattern: Pattern = [{ type: "Text", value: "${name" }]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`\\${name`")
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

it("should compile a pattern with a variableReference that isn't a valid JS identifier", () => {
	const pattern: Pattern = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "000" },
	]
	const { compiled } = compilePattern(pattern)
	expect(compiled).toBe("`Hello ${params['000']}`")
})
