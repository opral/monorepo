import { it, expect } from "vitest"
import { compilePattern } from "./compilePattern.js"
import { DEFAULT_REGISTRY } from "./registry.js"
import type { Pattern } from "@inlang/sdk2"

it("should compile a text only pattern", () => {
	const pattern: Pattern = [{ type: "text", value: "Hello" }]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`Hello`")
})

it("should compile a pattern with multiple VariableReference's", () => {
	const pattern: Pattern = [
		{ type: "text", value: "Hello " },
		{
			type: "expression",
			arg: {
				type: "variable",
				name: "name",
			},
		},
		{ type: "text", value: "! You have " },
		{ type: "expression", arg: { type: "variable", name: "count" } },
		{ type: "text", value: " messages." },
	]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`Hello ${inputs.name}! You have ${inputs.count} messages.`")
})

it("should escape backticks", () => {
	const pattern: Pattern = [{ type: "text", value: "`Hello world`" }]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`\\`Hello world\\``")
})

it("should escape backslashes", () => {
	const pattern: Pattern = [{ type: "text", value: "\\Hello world\\" }]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`\\\\Hello world\\\\`")
})

it("should escape escaped backticks", () => {
	const pattern: Pattern = [{ type: "text", value: "\\`Hello world\\`" }]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`\\\\\\`Hello world\\\\\\``")
})

it("should escape variable interpolation ( ${} )", () => {
	const pattern: Pattern = [{ type: "text", value: "${name" }]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`\\${name`")
})

it("should compile a pattern with multiple VariableReference's", () => {
	const pattern: Pattern = [
		{ type: "text", value: "Hello " },
		{ type: "expression", arg: { type: "variable", name: "name" } },
		{ type: "text", value: "! You have " },
		{ type: "expression", arg: { type: "variable", name: "count" } },
		{ type: "text", value: " messages." },
	]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`Hello ${inputs.name}! You have ${inputs.count} messages.`")
})

it("should compile a pattern with a variableReference that isn't a valid JS identifier", () => {
	const pattern: Pattern = [
		{ type: "text", value: "Hello " },
		{
			type: "expression",
			arg: {
				type: "variable",
				name: "000",
			},
		},
	]
	const { code } = compilePattern("en", pattern, DEFAULT_REGISTRY)
	expect(code).toBe("`Hello ${inputs['000']}`")
})
