import { expect, test, describe, vi } from "vitest"
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap"
import { Message, ProjectSettings } from "@inlang/sdk"
import { compile } from "./compile.js"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import terser from "@rollup/plugin-terser"
import { beforeEach } from "node:test"

beforeEach(() => {
	// reset the imports to make sure that the runtime is reloaded
	vi.resetModules()
})

describe("usage", async () => {
	// The compiled output needs to be bundled into one file to be dynamically imported.
	const bundle = await rollup({
		input: "test.js",
		plugins: [
			// @ts-expect-error - rollup types are not up to date
			virtual({
				"paraglide/messages.js": output["messages.js"],
				"paraglide/runtime.js": output["runtime.js"],
				"test.js": `
          export * as m from "./paraglide/messages.js"
          export * as runtime from "./paraglide/runtime.js"
        `,
			}),
		],
	})
	// dynamically import the compiled output
	const compiledBundle = await bundle.generate({ format: "esm" })

	test("should set the source language tag as default language tag", async () => {
		const { runtime } = await import(
			`data:application/javascript;base64,${btoa(compiledBundle.output[0].code)}`
		)
		expect(runtime.languageTag).toBe(runtime.sourceLanguageTag)
	})

	test("should return the correct message for the set language tag", async () => {
		const { m, runtime } = await import(
			`data:application/javascript;base64,${btoa(compiledBundle.output[0].code)}`
		)

		runtime.changeLanguageTag("en")

		expect(m.onlyText()).toBe("A simple message.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Good morning Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hello Samuel! You have 5 messages."
		)

		runtime.changeLanguageTag("de")

		expect(m.onlyText()).toBe("Eine einfache Nachricht.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Guten Morgen Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hallo Samuel! Du hast 5 Nachrichten."
		)
	})

	test("should return the message id if the message is not translated", async () => {
		const { m, runtime } = await import(
			`data:application/javascript;base64,${btoa(compiledBundle.output[0].code)}`
		)

		runtime.changeLanguageTag("fr")

		expect(m.onlyText()).toBe("onlyText")
		expect(m.oneParam({ name: "Samuel" })).toBe("oneParam")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe("multipleParams")
	})

	test("defining onChangeLanguageTag should be possible and should be called when the language tag changes", async () => {
		const { runtime } = await import(
			`data:application/javascript;base64,${btoa(compiledBundle.output[0].code)}`
		)

		const mockOnChangeLanguageTag = vi.fn().mockImplementation(() => {})
		runtime.onChangeLanguageTag((tag: any) => {
			mockOnChangeLanguageTag(tag)
		})

		runtime.changeLanguageTag("de")
		expect(mockOnChangeLanguageTag).toHaveBeenLastCalledWith("de")

		runtime.changeLanguageTag("en")
		expect(mockOnChangeLanguageTag).toHaveBeenLastCalledWith("en")

		expect(mockOnChangeLanguageTag).toHaveBeenCalledTimes(2)
	})

	test("should throw if the onChangeLanguageTag callback is already called to avoid unexpected behavior", async () => {
		// appending a random comment to make node treat this as a new module
		// otherwise, the runtime would be cached and the callback would already be set
		// from previous tests. using vi.resetModules() doesn't work for unknown reasons.
		const { runtime } = await import(
			`data:application/javascript;base64,${btoa(compiledBundle.output[0].code + "// afeqwss")}`
		)

		expect(() => {
			runtime.onChangeLanguageTag(() => {})
		}).not.toThrow()

		expect(() => {
			runtime.onChangeLanguageTag(() => {})
		}).toThrow()
	})
})

describe("tree-shaking", () => {
	// removing comments makes the output more predictable and testable
	const removeComments = () =>
		// @ts-expect-error - rollup types are not up to date
		terser({
			format: {
				comments: false,
			},
			compress: false,
			mangle: false,
		})

	test("should tree-shake unused messages", async () => {
		const bundle = await rollup({
			input: "app.js",
			plugins: [
				removeComments(),
				// @ts-expect-error - rollup types are not up to date
				virtual({
					"paraglide/messages.js": output["messages.js"],
					"paraglide/runtime.js": output["runtime.js"],
					"app.js": `
					import * as m from "./paraglide/messages.js"

					console.log(m.onlyText())
					`,
				}),
			],
		})
		const compiled = await bundle.generate({ format: "esm" })
		const log = vi.spyOn(console, "log").mockImplementation(() => {})
		// all required code for the message to be rendered is included like sourceLanguageTag.
		// but, all other messages except of 'onlyText' are tree-shaken away.
		expect(compiled.output[0].code).toBe(
			'const sourceLanguageTag="en";let languageTag=sourceLanguageTag;const onlyText=()=>{const contents={en:`A simple message.`,de:`Eine einfache Nachricht.`};return contents[languageTag]};console.log(onlyText());\n'
		)
		eval(compiled.output[0].code)
		expect(log).toHaveBeenCalledWith("A simple message.")
	})

	test("should not treeshake messages that are used", async () => {
		const bundle = await rollup({
			input: "app.js",
			plugins: [
				removeComments(),
				// @ts-expect-error - rollup types are not up to date
				virtual({
					"paraglide/messages.js": output["messages.js"],
					"paraglide/runtime.js": output["runtime.js"],
					"app.js": `

					import * as m from "./paraglide/messages.js"

					console.log(
						m.onlyText(),
						m.oneParam({ name: "Samuel" }),
						m.multipleParams({ name: "Samuel", count: 5 })
					)
					`,
				}),
			],
		})
		const result = await bundle.generate({ format: "esm" })
		const log = vi.spyOn(console, "log").mockImplementation(() => {})
		expect(result.output[0].code).toBe(
			'const sourceLanguageTag="en";let languageTag=sourceLanguageTag;const onlyText=()=>{const contents={en:`A simple message.`,de:`Eine einfache Nachricht.`};return contents[languageTag]};const oneParam=params=>{const contents={en:`Good morning ${params.name}!`,de:`Guten Morgen ${params.name}!`};return contents[languageTag]??"oneParam"};const multipleParams=params=>{const contents={en:`Hello ${params.name}! You have ${params.count} messages.`,de:`Hallo ${params.name}! Du hast ${params.count} Nachrichten.`};return contents[languageTag]??"multipleParams"};console.log(onlyText(),oneParam({name:"Samuel"}),multipleParams({name:"Samuel",count:5}));\n'
		)
		eval(result.output[0].code)
		expect(log).toHaveBeenCalledWith(
			"A simple message.",
			"Good morning Samuel!",
			"Hello Samuel! You have 5 messages."
		)
	})
})

test("typesafety", async () => {
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
	project.createSourceFile("messages.js", output["messages.js"])
	project.createSourceFile("runtime.js", output["runtime.js"])

	project.createSourceFile(
		"test.ts",
		`
    import * as m from "./messages.js"
    import * as runtime from "./runtime.js"

    // --------- RUNTIME ---------

    // sourceLanguageTag should have a narrow type, not a generic string

    runtime.sourceLanguageTag satisfies "en"

    // availableLanguageTags should have a narrow type, not a generic string
    runtime.availableLanguageTags satisfies Readonly<Array<"de" | "en">>

    // changeLanguageTag() should fail if the given language tag is not included in availableLanguageTags
    // @ts-expect-error - 
    runtime.changeLanguageTag("fr")

    // changeLanguageTag() should not fail if the given language tag is included in availableLanguageTags
    runtime.changeLanguageTag("de")

    // languageTag should return type should be a union of language tags, not a generic string
    runtime.languageTag satisfies "de" | "en"

    // --------- MESSAGES ---------

    // the return value of a message should be a string
    m.multipleParams({ name: "John", count: 5 }) satisfies string
      
    // @ts-expect-error - missing all params
    m.multipleParams()
      
    // @ts-expect-error - one param missing
    m.multipleParams({ name: "John" })

    // a message without params shouldn't require params
    m.onlyText() satisfies string
  `
	)

	const program = project.createProgram()
	const diagnostics = ts.getPreEmitDiagnostics(program)
	if (diagnostics.length > 0) {
		console.error(diagnostics)
	}
	expect(diagnostics.length).toBe(0)
})

const mockMessages: Message[] = [
	{
		id: "onlyText",
		selectors: [],
		variants: [
			{
				match: [],
				languageTag: "en",
				pattern: [{ type: "Text", value: "A simple message." }],
			},
			{
				match: [],
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
				match: [],
				languageTag: "en",
				pattern: [
					{ type: "Text", value: "Good morning " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "!" },
				],
			},
			{
				match: [],
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
				match: [],
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
				match: [],
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

const mockSettings: ProjectSettings = {
	sourceLanguageTag: "en",
	languageTags: ["en", "de"],
	modules: [],
}

const output = compile({ messages: mockMessages, settings: mockSettings })
