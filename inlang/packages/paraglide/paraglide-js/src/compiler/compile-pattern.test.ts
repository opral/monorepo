import { test, expect } from "vitest";
import { compilePattern } from "./compile-pattern.js";
import type { Pattern } from "@inlang/sdk";

test("should compile a text only pattern", () => {
	const pattern: Pattern = [{ type: "text", value: "Hello" }];
	const { code } = compilePattern({ pattern, declarations: [] });
	expect(code).toBe("`Hello`");
});

test("should compile a pattern with multiple VariableReference's", () => {
	const pattern: Pattern = [
		{ type: "text", value: "Hello " },
		{
			type: "expression",
			arg: {
				type: "variable-reference",
				name: "name",
			},
		},
		{ type: "text", value: "! You have " },
		{ type: "expression", arg: { type: "variable-reference", name: "count" } },
		{ type: "text", value: " messages." },
	];

	const { code } = compilePattern({
		pattern,
		declarations: [
			{ type: "input-variable", name: "name" },
			{ type: "input-variable", name: "count" },
		],
	});

	expect(code).toBe("`Hello ${i?.name}! You have ${i?.count} messages.`");
});

test("should escape backticks", () => {
	const pattern: Pattern = [{ type: "text", value: "`Hello world`" }];
	const { code } = compilePattern({ pattern, declarations: [] });
	expect(code).toBe("`\\`Hello world\\``");
});

test("should escape backslashes", () => {
	const pattern: Pattern = [{ type: "text", value: "\\Hello world\\" }];
	const { code } = compilePattern({ pattern, declarations: [] });

	expect(code).toBe("`\\\\Hello world\\\\`");
});

test("should escape escaped backticks", () => {
	const pattern: Pattern = [{ type: "text", value: "\\`Hello world\\`" }];
	const { code } = compilePattern({ pattern, declarations: [] });

	expect(code).toBe("`\\\\\\`Hello world\\\\\\``");
});

test("should escape variable interpolation ( ${} )", () => {
	const pattern: Pattern = [{ type: "text", value: "${name" }];
	const { code } = compilePattern({ pattern, declarations: [] });

	expect(code).toBe("`\\${name`");
});

test("it can reference local variables", () => {
	const { code } = compilePattern({
		pattern: [
			{ type: "text", value: "Hello " },
			{
				type: "expression",
				arg: {
					type: "variable-reference",
					name: "name",
				},
			},
		],
		declarations: [
			{
				type: "local-variable",
				name: "name",
				value: {
					type: "expression",
					arg: { type: "literal", value: "Peter" },
				},
			},
		],
	});

	expect(code).toBe("`Hello ${name}`");
});
