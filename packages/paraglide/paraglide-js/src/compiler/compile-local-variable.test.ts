import { test, expect } from "vitest";
import { compileLocalVariable } from "./compile-local-variable.js";

test("compiles a literal local variable", () => {
	const code = compileLocalVariable({
		locale: "en",
		declaration: {
			type: "local-variable",
			name: "myVar",
			value: { type: "expression", arg: { type: "literal", value: "Hello" } },
		},
	});
	expect(code).toEqual('const myVar = "Hello";');
});

test("compiles a variable reference local variable", () => {
	const code = compileLocalVariable({
		locale: "en",
		declaration: {
			type: "local-variable",
			name: "myVar",
			value: {
				type: "expression",
				arg: { type: "variable-reference", name: "name" },
			},
		},
	});
	expect(code).toEqual("const myVar = i?.name;");
});

test("compiles a local variable with an annotation and empty options", () => {
	const code = compileLocalVariable({
		locale: "en",
		declaration: {
			type: "local-variable",
			name: "myVar",
			value: {
				type: "expression",
				arg: { type: "literal", value: "Hello" },
				annotation: {
					type: "function-reference",
					name: "myFunction",
					options: [],
				},
			},
		},
	});
	expect(code).toEqual('const myVar = registry.myFunction("en", "Hello", {});');
});

test("compiles a local variable with an annotation and options", () => {
	const code = compileLocalVariable({
		locale: "en",
		declaration: {
			type: "local-variable",
			name: "myVar",
			value: {
				type: "expression",
				arg: { type: "literal", value: "Hello" },
				annotation: {
					type: "function-reference",
					name: "myFunction",
					options: [
						{ name: "option1", value: { type: "literal", value: "value1" } },
						{
							name: "option2",
							value: { type: "variable-reference", name: "varRef" },
						},
					],
				},
			},
		},
	});
	expect(code).toEqual(
		'const myVar = registry.myFunction("en", "Hello", { option1: "value1", option2: i?.varRef });'
	);
});
