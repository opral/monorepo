import { describe, it, expect } from "vitest"
import { createInlang } from "../createInlang.js"
import { createMockNodeishFs } from "@inlang/plugin/test"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin } from "@inlang/plugin"
import type { ImportFunction, InlangModule } from "@inlang/module"
import { createRoot, createEffect, from } from "../solid.js"
import { withSolidReactivity } from "./withSolidReactivity.js"
import type { LintRule } from "@inlang/lint"

describe("config", () => {
	it("should react to changes to config", async () => {
		const fs = await createMockNodeishFs({})
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		await createRoot(async () => {
			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counter = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.config()
				counter += 1
			})

			inlang.setConfig({ ...inlang.config(), languageTags: ["en", "de"] })
			expect(counter).toBe(2)
		})
	})
})

describe("meta", () => {
	it("should react to changes to config", async () => {
		await createRoot(async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counterPlugins = 0
			let counterLint = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.meta.plugins()
				counterPlugins += 1
			})

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.meta.lintRules()
				counterLint += 1
			})

			inlang.setConfig({ ...inlang.config(), languageTags: ["en", "fr"] })
			setTimeout(() => {
				expect(counterPlugins).toBe(2)
				expect(counterLint).toBe(2)
			}, 100)
		})
	})
})

describe("lintRules meta", () => {
	it.todo("should react to changes to config", async () => {
		const fs = await createMockNodeishFs({})
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		await createRoot(async () => {
			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counter = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.meta.lintRules()
				counter += 1
			})

			inlang.setConfig({ ...inlang.config(), modules: ["/test"] })
			expect(counter).toBe(2)
			expect(inlang.meta.lintRules()[0]?.id).toBe("mock.lint-rule")
		})
	})
})

describe("plugins", () => {
	it("should react to changes to config", async () => {
		const fs = await createMockNodeishFs({})
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		await createRoot(async () => {
			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counter = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.meta.lintRules()
				counter += 1
			})

			inlang.setConfig({ ...inlang.config(), languageTags: ["en", "de"] })
			setTimeout(() => {
				expect(counter).toBe(2)
				expect(inlang.meta.lintRules()[0]?.id).toBe("inlang.plugin-i18next")
			}, 100)
		})
	})
})

describe("messages", () => {
	it("should react to changes to config", async () => {
		await createRoot(async () => {
			const fs = await createMockNodeishFs({})
			const mockConfig: InlangConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en", "de"],
				modules: ["./plugin-a.js"],
				settings: {},
			}
			const _mockPlugin: Plugin = {
				meta: {
					id: "mock.plugin",
					displayName: {
						en: "hello",
					},
					description: {
						en: "wo",
					},
					keywords: [],
				},
				loadMessages: ({ languageTags }) => {
					if (languageTags.length === 0) {
						return []
					} else {
						return exampleMessages
					}
				},
				saveMessages: () => undefined as any,
			}

			const mockImport: ImportFunction = async () =>
				({
					default: {
						plugins: [_mockPlugin],
						lintRules: [mockLintRule],
					},
				} satisfies InlangModule)

			await fs.writeFile("./inlang.config.json", JSON.stringify(mockConfig))

			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counter = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.query.messages.getAll()
				counter += 1
			})

			expect(inlang.query.messages.getAll().length).toEqual(2)

			inlang.setConfig({ ...inlang.config(), languageTags: [] })

			setTimeout(() => {
				expect(counter).toBe(2)
				expect(inlang.query.messages.getAll().length).toEqual(0)
			}, 100)
		})
	})
	it("should react to change messages", async () => {
		await createRoot(async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = withSolidReactivity(
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)
			let counter = 0

			createEffect(() => {
				// 2 times because effect creation + set
				inlang.query.messages.getAll()
				counter += 1
			})
			inlang.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					body: {
						en: [
							{
								match: {},
								pattern: [
									{
										type: "Text",
										value: "test2",
									},
								],
							},
						],
					},
				},
			})
			setTimeout(() => {
				expect(counter).toBe(2)
				expect(inlang.query.messages.getAll().length).toEqual(2)
			}, 200)
		})
	})
})

describe("lint", () => {
	it.todo("should react to changes to config")
	it.todo("should react to changes to modules")
	it.todo("should react to changes to mesages")
})

const config: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["./dist/index.js"],
	settings: {
		"system.lint.levels": {
			"inlang.lintRule.missingMessage": "error",
		},
		"inlang.pluginI18next": {
			pathPattern: "./examples/example01/{languageTag}.json",
			variableReferencePattern: ["{", "}"],
		},
	},
}

const mockPlugin: Plugin = {
	meta: {
		id: "inlang.plugin-i18next",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
		keywords: [],
	},
	loadMessages: () => exampleMessages,
	saveMessages: () => undefined as any,
	addAppSpecificApi: () => ({
		"inlang.ide-extension": {
			messageReferenceMatcher: (text: string) => text as any,
		},
	}),
}

const exampleMessages: Message[] = [
	{
		id: "a",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
	},
	{
		id: "b",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
	},
]

const mockLintRule: LintRule = {
	type: "MessageLint",
	meta: {
		id: "namespace.lintRuleMock",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	defaultLevel: "error",
	message: () => undefined,
}

const $import: ImportFunction = async () =>
	({
		default: {
			plugins: [mockPlugin],
			lintRules: [mockLintRule],
		},
	} satisfies InlangModule)
