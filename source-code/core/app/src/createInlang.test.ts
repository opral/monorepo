import { describe, it, expect } from "vitest"
import { createInlang } from "./createInlang.js"
import { createMockNodeishFs } from "@inlang/plugin/test"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { ImportFunction, InlangModule } from "@inlang/module"

// import nodeFs from "node:fs/promises"
import { createRoot, createEffect } from "./solid.js"

// async function createMockNodeishFs(args: any) {
// 	return nodeFs
// }

describe("initialization", () => {
	describe("config", () => {
		it("should throw if config file is not found", async () => {
			const fs = await createMockNodeishFs({})
			// try {
			// 	await fs.readFile("./inlang.config.json", "utf-8")
			// } catch (e) {
			// 	expect((e as Error).message).toBe(
			// 		"ENOENT: no such file or directory, open './inlang.config.json'",
			// 	)
			// }

			// try {
			// 	await createInlang({
			// 		configPath: "./test.json",
			// 		nodeishFs: fs,
			// 		_import: $import,
			// 	})
			// 	throw new Error("Should not reach this")
			// } catch (e) {
			// 	expect((e as Error).message).toBe("Config file not found")
			// }
		})

		it.todo("should throw if config file is not a valid JSON", async () => {
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
				expect((e as Error).message).toBe("Config file is not valid JSON")
			}
		})

		it.todo("should throw if config file is does not match schema", async () => {
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
				expect((e as Error).message).toBe("Config file does not match schema")
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
			expect(inlang.config()).toEqual(config)
		})

		it("should set a new config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			expect(inlang.config()).toEqual(config)

			const newConfig: InlangConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["./dist/index.js"],
				settings: {
					plugins: {
						"inlang.plugin-json": {
							options: {
								pathPattern: "./examples/example01/{languageTag}.json",
								variableReferencePattern: ["{", "}"],
							},
						},
					},
					lintRules: {
						"inlang.missingMessage": {
							level: "warning",
						},
					},
				},
			}
			inlang.setConfig(newConfig)
			expect(inlang.config()).toEqual(newConfig)
		})
	})

	describe("modules", () => {
		it.todo("should throw if plugins contain errors ???")
		it.todo("should throw if lintRules contain errors ???")
		it.todo("should return meta data")
		it.todo("should return plugins")
		it.todo("should return lint rules")
	})

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
			expect(inlang.config()).toEqual(config)
		})

		it("should set a new config", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			expect(inlang.config()).toEqual(config)
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

			expect(inlang.config().modules[0]).toEqual("./dist/index.js")
			expect(inlang.meta.plugins()[0]?.id).toEqual("inlang.plugin-i18next")
			expect(inlang.meta.lintRules()[0]?.id).toEqual("mock.lint-rule")
		})
	})

	describe("errors", () => {
		it.todo("should return the errors", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			// console.log(inlang.errors)
			// expect(inlang.errors()).toEqual([])
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

			expect(
				(
					inlang.appSpecificApi()["inlang.ide-extension"] as {
						messageReferenceMatcher: (text: string) => string
					}
				).messageReferenceMatcher("test"),
			).toEqual("test")
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
		it("should throw if lint reports are not initialized yet", async () => {
			const fs = await createMockNodeishFs({})
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			// TODO: test with real lint rules
			try {
				expect(inlang.lint.reports()).toEqual([])
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
			expect(inlang.lint.reports()).toEqual([])
		})
	})
})

describe("reactivity", () => {
	describe("config", () => {
		it("should react to changes to config", async () => {
			await createRoot(async () => {
				const fs = await createMockNodeishFs({})
				await fs.writeFile("./inlang.config.json", JSON.stringify(config))
				const inlang = await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
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

	describe("modules", () => {
		it("should react to changes to config", async () => {
			await createRoot(async () => {
				const fs = await createMockNodeishFs({})
				await fs.writeFile("./inlang.config.json", JSON.stringify(config))
				const inlang = await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				let counter = 0

				createEffect(() => {
					// 2 times because effect creation + set
					inlang.config().modules
					counter += 1
				})

				inlang.setConfig({ ...inlang.config(), languageTags: ["en", "de"] })
				expect(counter).toBe(2)
				expect(inlang.config().modules[0]).toBe("./dist/index.js")
			})
		})
	})

	// describe("lintRules meta", () => {
	// 	it("should react to changes to config", async () => {
	// 		await createRoot(async () => {
	// 			const fs = await createMockNodeishFs({})
	// 			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
	// 			const inlang = await createInlang({
	// 				configPath: "./inlang.config.json",
	// 				nodeishFs: fs,
	// 				_import: $import,
	// 			})
	// 			let counter = 0

	// 			createEffect(() => {
	// 				// 2 times because effect creation + set
	// 				inlang.meta.lintRules()
	// 				counter += 1
	// 			})

	// 			inlang.setConfig({ ...inlang.config(), modules: ["/test"] })
	// 			expect(counter).toBe(2)
	// 			expect(inlang.meta.lintRules()[0]?.id).toBe("mock.lint-rule")
	// 		})
	// 	})
	// })

	// describe("plugins", () => {
	// 	it("should react to changes to config", async () => {
	// 		await createRoot(async () => {
	// 			const fs = await createMockNodeishFs({})
	// 			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
	// 			const inlang = await createInlang({
	// 				configPath: "./inlang.config.json",
	// 				nodeishFs: fs,
	// 				_import: $import,
	// 			})
	// 			const reactivePlugins = inlang.meta.lintRules
	// 			let counter = 0

	// 			createEffect(() => {
	// 				// 2 times because effect creation + set
	// 				reactivePlugins()
	// 				counter += 1
	// 			})

	// 			inlang.setConfig({ ...inlang.config(), languageTags: ["en", "de"] })
	// 			expect(counter).toBe(2)
	// 			expect(reactivePlugins()[0]?.id).toBe("inlang.plugin-i18next")
	// 		})
	// 	})
	// })

	describe("messages", () => {
		it("should react to changes to config", async () => {
			await createRoot(async () => {
				const fs = await createMockNodeishFs({})
				const mockConfig: InlangConfig = {
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
					modules: ["./plugin-a.js"],
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

				const inlang = await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: mockImport,
				})
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
				}, 1000)
			})
		})
		// it("should react to changes to modules", async () => {
		// 	await createRoot(async () => {
		// 		const fs = await createMockNodeishFs({})
		// 		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		// 		const inlang = await createInlang({
		// 			configPath: "./inlang.config.json",
		// 			nodeishFs: fs,
		// 			_import: $import,
		// 		})
		// 		let counter = 0

		// 		createEffect(() => {
		// 			// 2 times because effect creation + set
		// 			inlang.query.messages.getAll()
		// 			counter += 1
		// 		})

		// 		inlang.setConfig({ ...inlang.config(), modules: ["./newModules"] })
		// 		expect(counter).toBe(2)
		// 		expect(inlang.query.messages.getAll().length).toEqual(2)
		// 	})
		// })
	})

	// 	describe("lint", () => {
	// 		it("should react to changes to config", async () => {
	// 			await createRoot(async () => {
	// 				const fs = await createMockNodeishFs({})
	// 				await fs.writeFile("./inlang.config.json", JSON.stringify(config))
	// 				const inlang = await createInlang({
	// 					configPath: "./inlang.config.json",
	// 					nodeishFs: fs,
	// 					_import: $import,
	// 				})
	// 				let counter = 0

	// 				createEffect(() => {
	// 					// 2 times because effect creation + set
	// 					inlang.query.messages.getAll()
	// 					counter += 1
	// 				})

	// 				inlang.setConfig({ ...inlang.config(), languageTags: ["en", "de"] })
	// 				expect(counter).toBe(2)
	// 			})
	// 		})
	// 		it("should react to changes to modules", async () => {
	// 			await createRoot(async () => {
	// 				const fs = await createMockNodeishFs({})
	// 				await fs.writeFile("./inlang.config.json", JSON.stringify(config))
	// 				const inlang = await createInlang({
	// 					configPath: "./inlang.config.json",
	// 					nodeishFs: fs,
	// 					_import: $import,
	// 				})
	// 				let counter = 0

	// 				createEffect(() => {
	// 					// 2 times because effect creation + set
	// 					inlang.query.messages.getAll()
	// 					counter += 1
	// 				})

	// 				inlang.setConfig({ ...inlang.config(), modules: ["./newModules"] })
	// 				expect(counter).toBe(2)
	// 			})
	// 		})
	// 		it.todo("should react to changes to mesages")
	// 	})
})

const config: InlangConfig = {
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
	meta: {
		id: "mock.lint-rule",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	defaultLevel: "error",
}

const $import: ImportFunction = async () =>
	({
		default: {
			plugins: [mockPlugin],
			lintRules: [mockLintRule],
		},
	} satisfies InlangModule)
