import { it, expect } from "vitest"
import { compilePattern } from "./compilePattern.js"
import type { Pattern } from "@inlang/sdk"
import { createProject, ts } from "@ts-morph/bootstrap"

it("should compile a text only pattern", () => {
	const pattern: Pattern = [{ type: "Text", value: "Hello" }]
	const compiled = compilePattern(pattern)
	expect(compiled).toBe("() => `Hello`")
	expect(eval(compiled)()).toBe("Hello")
})

it("should compile a pattern with multiple VariableReference's", () => {
	const pattern: Pattern = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "name" },
		{ type: "Text", value: "! You have " },
		{ type: "VariableReference", name: "count" },
		{ type: "Text", value: " messages." },
	]
	const compiled = compilePattern(pattern)
	expect(compiled).toBe(
		"/** @param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params */(params) => `Hello ${params.name}! You have ${params.count} messages.`",
	)
	expect(eval(compiled)({ name: "John", count: 5 })).toBe("Hello John! You have 5 messages.")
})

it("should emit typesafe params", async () => {
	const pattern: Pattern = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "name" },
		{ type: "Text", value: "! You have " },
		{ type: "VariableReference", name: "count" },
		{ type: "Text", value: " messages." },
	]

	const project = await createProject({
		useInMemoryFileSystem: true,
		compilerOptions: {
			outDir: "dist",
			declaration: true,
			allowJs: true,
			checkJs: true,
			module: ts.ModuleKind.Node16,
			strict: true,
		},
	})

	project.createSourceFile(
		"message.js",
		`
    export const message = ${compilePattern(pattern)}
  `,
	)

	project.createSourceFile(
		"main.ts",
		`
    import { message } from "./message.js"

    // should succeed
    const result: string = message({ name: "John", count: 5 })

    // @ts-expect-error - missing params
    message()

		// @ts-expect-error - missing one param
    message({ name: "John" })
  `,
	)

	const program = project.createProgram()
	const diagnostics = ts.getPreEmitDiagnostics(program)

	expect(diagnostics).toStrictEqual([])
})
