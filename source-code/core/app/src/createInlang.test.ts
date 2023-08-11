import { describe, it, expect } from "vitest"
import { createInlang } from "./createInlang.js"
import { createMockNodeishFs } from "@inlang/plugin/test"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { ImportFunction, InlangModule } from "@inlang/module"
import { ConfigPathNotFoundError, ConfigSyntaxError, InvalidConfigError } from "./errors.js"

describe("initialization", () => {
	describe("config", () => {
		it("should throw if config file is not found", async () => {
			const fs = await createMockNodeishFs({})
			try {
				await createInlang({
					configPath: "./test.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			} catch (e) {
				expect(e).toBeInstanceOf(ConfigPathNotFoundError)
			}
		})

		it("should throw if config file is not a valid JSON", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", "invalid json")
			try {
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			} catch (e) {
				expect(e).toBeInstanceOf(ConfigSyntaxError)
			}
		})

		it("should throw if config file is does not match schema", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify({}))
			try {
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidConfigError)
			}
		})

		it("should return the parsed config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			inlang.config.subscribe((c) => {
				expect(c).toStrictEqual({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["./dist/index.js"],
					settings: {
						plugins: {
							"inlang.plugin-i18next": {
								options: {
									pathPattern: "./examples/example01/{languageTag}.json",
									variableReferencePattern: ["{", "}"],
								},
							},
						},
						lintRules: {
							"inlang.missingMessage": {
								level: "error",
							},
						},
					},
				})
			})
		})

		it("should set a new config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})

			const newConfig: InlangConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["./dist/index.js"],
				settings: {
					"inlang.pluginJson": {
						pathPattern: "./examples/example01/{languageTag}.json",
						variableReferencePattern: ["{", "}"],
					},
					"inlang.lintRuleMissingMessage": {
						level: "warning",
					},
				},
			}
			inlang.config.subscribe((c) => {
				expect(c).toStrictEqual(newConfig)
			})
		})
	})

	// describe("modules", () => {
	// 	it.todo("should throw if plugins contain errors", async () => {
	// 		const badPlugin: Plugin = {
	// 			...mockPlugin,
	// 		}
	// 		const $badImport: ImportFunction = async () =>
	// 			({
	// 				default: {
	// 					plugins: [badPlugin],
	// 					lintRules: [mockLintRule],
	// 				},
	// 			} satisfies InlangModule)

	// 		const fs = await createMockNodeishFs({})
	// 		await fs.writeFile("./inlang.config.json", JSON.stringify(config))

	// 		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 		const inlang = await createInlang({
	// 			configPath: "./inlang.config.json",
	// 			nodeishFs: fs,
	// 			_import: $badImport,
	// 		})

	// 		// inlang.errors.subscribe((errors) => {
	// 		// 	console.log(errors)
	// 		// })
	// 	})
	// 	it.todo("should throw if lintRules contain errors ???")
	// 	it.todo("should return meta data")
	// 	it.todo("should return plugins")
	// 	it.todo("should return lint rules")
	// })

	describe("flow", () => {
		it.todo("should not call functions multiple times")
		it.todo("should load modules after config")
		it.todo("should not load messages")
		it.todo("should not call lint")
	})

	describe("instance object", () => {
		it.todo("should contain all fields")
	})
})

describe("functionality", () => {
	describe("config", () => {
		it("should return the config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})

			inlang.config.subscribe((c) => {
				expect(c).toStrictEqual({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["./dist/index.js"],
					settings: {
						plugins: {
							"inlang.plugin-i18next": {
								options: {
									pathPattern: "./examples/example01/{languageTag}.json",
									variableReferencePattern: ["{", "}"],
								},
							},
						},
						lintRules: {
							"inlang.missingMessage": {
								level: "error",
							},
						},
					},
				})
			})
		})

		it("should set a new config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			inlang.setConfig({ ...config, languageTags: ["en", "de"] })
			expect(inlang.config().languageTags.length).toEqual(2)
		})

		it("should set a new config", async () => {
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: {} as any,
			})

			expect(inlang.config()).toEqual(config)

			let count = 0

			inlang.config.subscribe((config) => {
				if (count === 0) {
					expect(config).toEqual({ ...config, languageTags: ["en", "de"] })
				} else if (count === 1) {
					expect(config).toEqual({ ...config, languageTags: ["en", "de", "fr"] })
				} else {
					throw Error("Unexpected config change")
				}
				count++
			})

			inlang.setConfig({ ...config, languageTags: ["en", "de"] })
			expect(inlang.config().languageTags).toEqual(["en", "de"])
			inlang.setConfig({ ...config, languageTags: ["en", "de", "fr"] })
			expect(inlang.config().languageTags).toEqual(["en", "de", "fr"])
		})
	})

	describe("meta", () => {
		it("should return the meta data", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})

			inlang.meta.plugins.subscribe((plugins) => {
				expect(plugins[0]).toStrictEqual({
					id: "inlang.plugin-i18next",
					displayName: {
						en: "Mock Plugin",
					},
					description: {
						en: "Mock plugin description",
					},
					keywords: [],
					module: "./dist/index.js",
				})
			})
		})
	})

	describe("errors", () => {
		it("should return the errors", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			inlang.errors.subscribe((errors) => {
				expect(errors).toStrictEqual([])
			})
		})
	})

	describe("appSpecificApi", () => {
		it("should return the app specific api", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})

			inlang.appSpecificApi.subscribe((api) => {
				expect(api["inlang.ide-extension"]).toBeDefined()
			})
		})
	})

	describe("messages", () => {
		it("should return the messages", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})

			expect(inlang.query.messages.getAll()).toEqual(exampleMessages)
		})
	})

	describe("lint", () => {
		it.todo("should throw if lint reports are not initialized yet", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			// TODO: test with real lint rules
			try {
				inlang.lint.reports.subscribe((r) => expect(r).toEqual([]))
				throw new Error("Should not reach this")
			} catch (e) {
				expect((e as Error).message).toBe("lint not initialized yet")
			}
		})
		it("should return the lint reports", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			await inlang.lint.init()
			// TODO: test with real lint rules
			inlang.lint.reports.subscribe((r) => expect(r).toEqual([]))
		})
	})
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
