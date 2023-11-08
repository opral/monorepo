import { expect, test, describe, vi, beforeEach } from "vitest"
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap"
import { Message, ProjectSettings } from "@inlang/sdk"
import { compile } from "./compile.js"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import terser from "@rollup/plugin-terser"

beforeEach(() => {
	// reset the imports to make sure that the runtime is reloaded
	vi.resetModules()
})

describe("files", async () => {
	// the compiled should be ignored to avoid merge conflicts
	test("the files should include a gitignore file", async () => {
		const output = compile({ messages: [], settings: mockSettings })
		expect(output).toHaveProperty(".gitignore")
		expect(output[".gitignore"]).toContain("*")
	})
	// ignore all formatting stuff
	test("the files should include a prettierignore file", async () => {
		const output = compile({ messages: [], settings: mockSettings })
		expect(output).toHaveProperty(".prettierignore")
		expect(output[".prettierignore"]).toContain("*")
	})
	// ignore eslint stuff
	test("files should include an eslint ignore", async () => {
		const output = compile({ messages: [], settings: mockSettings })
		expect(output).toHaveProperty(".eslintignore")
		expect(output[".eslintignore"]).toContain("*")
	})
})

describe("usage", async () => {
	// The compiled output needs to be bundled into one file to be dynamically imported.
	const bundle = await rollup({
		input: "test.js",
		plugins: [
			// @ts-expect-error - rollup types are not up to date
			virtual({
				"paraglide/messages/de.js": output["messages/de.js"],
				"paraglide/messages/en.js": output["messages/en.js"],
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
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code,
				"utf8"
			).toString("base64")}`
		)
		expect(runtime.languageTag()).toBe(runtime.sourceLanguageTag)
	})

	test("should return the correct message for the set language tag", async () => {
		const { m, runtime } = await import(
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code,
				"utf8"
			).toString("base64")}`
		)

		runtime.setLanguageTag("en")

		expect(m.onlyText()).toBe("A simple message.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Good morning Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hello Samuel! You have 5 messages."
		)

		runtime.setLanguageTag("de")

		expect(m.onlyText()).toBe("Eine einfache Nachricht.")
		expect(m.oneParam({ name: "Samuel" })).toBe("Guten Morgen Samuel!")
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(
			"Hallo Samuel! Du hast 5 Nachrichten."
		)
	})

	test("setting the languageTag as a getter function should be possible", async () => {
		const { m, runtime } = await import(
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code,
				"utf8"
			).toString("base64")}`
		)

		runtime.setLanguageTag(() => "en")

		expect(m.onlyText()).toBe("A simple message.")

		runtime.setLanguageTag(() => "de")

		expect(m.onlyText()).toBe("Eine einfache Nachricht.")
	})

	// any missing translation heuristic e.g. "show the id" or similar
	// can be mitigated by using lint rules. furthermore, the bundle
	// size will be larger if the id is included in the compiled output
	// instead of undefined.
	test("should return undefined if the message is not translated", async () => {
		const { m, runtime } = await import(
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code,
				"utf8"
			).toString("base64")}`
		)

		runtime.setLanguageTag("fr")

		expect(m.onlyText()).toBe(undefined)
		expect(m.oneParam({ name: "Samuel" })).toBe(undefined)
		expect(m.multipleParams({ name: "Samuel", count: 5 })).toBe(undefined)
	})

	test("defining onSetLanguageTag should be possible and should be called when the language tag changes", async () => {
		const { runtime } = await import(
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code,
				"utf8"
			).toString("base64")}`
		)

		const mockOnSetLanguageTag = vi.fn().mockImplementation(() => {})
		runtime.onSetLanguageTag((tag: any) => {
			mockOnSetLanguageTag(tag)
		})

		runtime.setLanguageTag("de")
		expect(mockOnSetLanguageTag).toHaveBeenLastCalledWith("de")

		runtime.setLanguageTag("en")
		expect(mockOnSetLanguageTag).toHaveBeenLastCalledWith("en")

		expect(mockOnSetLanguageTag).toHaveBeenCalledTimes(2)
	})

	test("should throw if the onSetLanguageTag callback is already called to avoid unexpected behavior", async () => {
		// appending a random comment to make node treat this as a new module
		// otherwise, the runtime would be cached and the callback would already be set
		// from previous tests. using vi.resetModules() doesn't work for unknown reasons.
		const { runtime } = await import(
			`data:application/javascript;base64,${Buffer.from(
				compiledBundle.output[0].code + "//" + Math.random(),
				"utf8"
			).toString("base64")}`
		)

		expect(() => {
			runtime.onSetLanguageTag(() => {})
		}).not.toThrow()

		expect(() => {
			runtime.onSetLanguageTag(() => {})
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
					"paraglide/messages/de.js": output["messages/de.js"],
					"paraglide/messages/en.js": output["messages/en.js"],
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
		for (const id of mockMessages.map((m) => m.id)) {
			if (id === "onlyText") {
				expect(compiled.output[0].code).toContain(id)
			} else {
				expect(compiled.output[0].code).not.toContain(id)
			}
		}
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
					"paraglide/messages/de.js": output["messages/de.js"],
					"paraglide/messages/en.js": output["messages/en.js"],
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
		for (const id of mockMessages.map((m) => m.id)) {
			if (["onlyText", "oneParam", "multipleParams"].includes(id)) {
				expect(result.output[0].code).toContain(id)
			} else {
				expect(result.output[0].code).not.toContain(id)
			}
		}
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

	for (const [fileName, code] of Object.entries(output)) {
		if (fileName.endsWith(".js")) {
			project.createSourceFile(fileName, code)
		}
	}

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

    // setLanguageTag() should fail if the given language tag is not included in availableLanguageTags
    // @ts-expect-error - 
    runtime.setLanguageTag("fr")

    // setLanguageTag() should not fail if the given language tag is included in availableLanguageTags
    runtime.setLanguageTag("de")

    // languageTag should return type should be a union of language tags, not a generic string
    runtime.languageTag() satisfies "de" | "en"

		// setting the language tag as a getter function should be possible

		runtime.setLanguageTag(() => "en")

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
		id: "missingTranslation",
		selectors: [],
		variants: [
			{
				match: [],
				languageTag: "en",
				pattern: [{ type: "Text", value: "A simple message." }],
			},
		],
	},
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
