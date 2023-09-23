import { describe, it, expect } from "vitest"
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap"
import { Message } from "@inlang/sdk"
import { compile } from "./compile.js"

// describe("runtime", () => {})

// describe("treeshaking", () => {})

describe("typesafety", async () => {
	const createProject = async () => {
		const project = await typescriptProject({
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
		project.createSourceFile("index.js", output["index.js"])
		project.createSourceFile("messages.js", output["messages.js"])
		project.createSourceFile("runtime.js", output["runtime.js"])
		return project
	}

	it("params of messages should be typesafe", async () => {
		const project = await createProject()
		project.createSourceFile(
			"main.ts",
			`
      import { multipleParams } from "./messages.js"
      
      // should succeed
      const result: string = multipleParams({ name: "John", count: 5 })
      
      // @ts-expect-error - missing all params
      multipleParams()
      
      // @ts-expect-error - wrong one param
      multipleParams({ name: "John" })
      `,
		)
		const program = project.createProgram()
		const diagnostics = ts.getPreEmitDiagnostics(program)
		// the tests are hanging if .toStrictEqual is used
		if (diagnostics.length > 0) {
			console.error(diagnostics)
		}
		expect(diagnostics.length).toBe(0)
	})
})

const mockMessages: Message[] = [
	{
		id: "onlyText",
		selectors: [],
		variants: [
			{
				match: {},
				languageTag: "en",
				pattern: [{ type: "Text", value: "A simple message." }],
			},
			{
				match: {},
				languageTag: "de",
				pattern: [{ type: "Text", value: "Eine einfache Nachricht." }],
			},
		],
	},
	{
		id: "oneParam",
		selectors: [],
		variants: [
			{
				match: {},
				languageTag: "en",
				pattern: [
					{ type: "Text", value: "Good morning " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "!" },
				],
			},
			{
				match: {},
				languageTag: "de",
				pattern: [
					{ type: "Text", value: "Guten Morgen " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "!" },
				],
			},
		],
	},
	{
		id: "multipleParams",
		selectors: [],
		variants: [
			{
				match: {},
				languageTag: "en",
				pattern: [
					{ type: "Text", value: "Hello " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "! You have " },
					{ type: "VariableReference", name: "count" },
					{ type: "Text", value: " messages." },
				],
			},
			{
				match: {},
				languageTag: "de",
				pattern: [
					{ type: "Text", value: "Hallo " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "! Du hast " },
					{ type: "VariableReference", name: "count" },
					{ type: "Text", value: " Nachrichten." },
				],
			},
		],
	},
]

const output = compile({ messages: mockMessages })
