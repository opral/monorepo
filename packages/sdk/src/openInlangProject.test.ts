/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi } from "vitest"
import { openInlangProject } from "./openInlangProject.js"
import type { ProjectConfig, Plugin, LintRule, Message } from "./interfaces.js"
import type { ImportFunction, InlangModule } from "./resolve-modules/index.js"
import {
	ProjectFilePathNotFoundError,
	ProjectFileJSONSyntaxError,
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
} from "./errors.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

// ------------------------------------------------------------------------------------------------

const getValue = <T>(subscribable: { subscribe: (subscriber: (value: T) => void) => void }): T => {
	let value: T
	subscribable.subscribe((v) => void (value = v))
	return value!
}

const config: ProjectConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["plugin.js", "lintRule.js"],
	settings: {
		"project.lintRuleLevels": {
			"lintRule.inlang.missingTranslation": "error",
		},
		"plugin.inlang.i18next": {
			pathPattern: "./examples/example01/{languageTag}.json",
			variableReferencePattern: ["{", "}"],
		},
	},
}

const mockPlugin: Plugin = {
	meta: {
		id: "plugin.inlang.i18next",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
	},
	loadMessages: () => exampleMessages,
	saveMessages: () => undefined as any,
	addCustomApi: () => ({
		"app.inlang.ideExtension": {
			messageReferenceMatcher: (text: string) => text as any,
		},
	}),
}

// TODO: use `createMessage` utility
const exampleMessages: Message[] = [
	{
		id: "a",
		selectors: [],
		variants: [
			{
				languageTag: "en",
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
	{
		id: "b",
		selectors: [],
		variants: [
			{
				languageTag: "en",
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
]

const mockLintRule: LintRule = {
	type: "MessageLint",
	meta: {
		id: "lintRule.inlang.mock",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	message: () => undefined,
}

const _import: ImportFunction = async (name) =>
	({
		default: name === "plugin.js" ? mockPlugin : mockLintRule,
	} satisfies InlangModule)

// ------------------------------------------------------------------------------------------------

describe("initialization", () => {
	describe("config", () => {
		it("should return an error if config file is not found", async () => {
			const fs = createNodeishMemoryFs()

			const inlang = await openInlangProject({
				projectFilePath: "./test.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.errors()![0]).toBeInstanceOf(ProjectFilePathNotFoundError)
		})

		it("should return an error if config file is not a valid JSON", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", "invalid json")

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.errors()![0]).toBeInstanceOf(ProjectFileJSONSyntaxError)
		})

		it("should return an error if config file is does not match schema", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify({}))

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.errors()![0]).toBeInstanceOf(InvalidConfigError)
		})

		it("should return the parsed config", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.config()).toStrictEqual(config)
		})

		it("should not re-write the config to disk when initializing", async () => {
			const fs = await createNodeishMemoryFs()
			const configWithDeifferentFormatting = JSON.stringify(config, undefined, 4)
			await fs.writeFile("./project.inlang.json", configWithDeifferentFormatting)

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			const configOnDisk = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(configOnDisk).toBe(configWithDeifferentFormatting)

			inlang.setConfig(inlang.config()!)
			// TODO: how can we await `setConfig` correctly
			await new Promise((resolve) => setTimeout(resolve, 0))

			const newConfigOnDisk = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(newConfigOnDisk).not.toBe(configWithDeifferentFormatting)
		})
	})

	describe("modules", () => {
		it("should return an error if no plugin defines readMessages", async () => {
			const $badImport: ImportFunction = async () =>
				({
					default: { ...mockPlugin, loadMessages: undefined as any } as Plugin,
				} satisfies InlangModule)

			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $badImport,
			})

			expect(inlang.errors()![0]).toBeInstanceOf(NoPluginProvidesLoadOrSaveMessagesError)
		})

		it("should return an error if no plugin defines writeMessages", async () => {
			const $badImport: ImportFunction = async () =>
				({
					default: { ...mockPlugin, writeMessages: undefined as any } as Plugin,
				} satisfies InlangModule)

			const fs = createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $badImport,
			})

			expect(inlang.errors()![0]).toBeInstanceOf(NoPluginProvidesLoadOrSaveMessagesError)
		})

		it("should return an error if an error occurs while resolving a plugin", async () => {
			const $badImport: ImportFunction = async () =>
				({
					default: {} as Plugin,
				} satisfies InlangModule)

			const fs = createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $badImport,
			})

			expect(inlang.errors()).toHaveLength(1)
		})
		// 	it.todo("should throw if lintRules contain errors ???")
		// 	it.todo("should return meta data")
		// 	it.todo("should return plugins")
		// 	it.todo("should return lint rules")
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
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(getValue(inlang.config)).toStrictEqual(config)
		})

		it("should set a new config", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.config()).toStrictEqual(config)

			inlang.setConfig({ ...config, languageTags: ["en", "de"] })
			expect(getValue(inlang.config)).toStrictEqual({ ...config, languageTags: ["en", "de"] })
			expect(inlang.config()!.languageTags).toStrictEqual(["en", "de"])

			inlang.setConfig({ ...config, languageTags: ["en", "de", "fr"] })
			expect(getValue(inlang.config)).toStrictEqual({ ...config, languageTags: ["en", "de", "fr"] })
			expect(inlang.config()!.languageTags).toStrictEqual(["en", "de", "fr"])
		})
	})

	describe("setConfig", () => {
		it("should fail if config is not valid", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			const result = inlang.setConfig({} as ProjectConfig)
			expect(result.data).toBeUndefined()
			expect(result.error).toBeInstanceOf(InvalidConfigError)
		})

		it("should write config to disk", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			const before = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(before).toBeDefined()

			const result = inlang.setConfig({ ...config, languageTags: [] })
			expect(result.data).toBeUndefined()
			expect(result.error).toBeUndefined()

			// TODO: how to wait for fs.writeFile to finish?
			await new Promise((resolve) => setTimeout(resolve, 0))

			const after = await fs.readFile("./project.inlang.json", { encoding: "utf-8" })
			expect(after).toBeDefined()
			expect(after).not.toBe(before)
		})
	})

	describe("installed", () => {
		it("should return the installed items", async () => {
			const fs = createNodeishMemoryFs()
			const config: ProjectConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["plugin.js", "lintRule.js"],
				settings: {},
			}
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.installed.plugins()[0]).toStrictEqual({
				meta: mockPlugin.meta,
				module: config.modules[0],
			})

			expect(inlang.installed.lintRules()[0]).toEqual({
				meta: mockLintRule.meta,
				module: config.modules[1],
				lintLevel: "warning",
			})
		})

		it("should apply 'warning' as default lint level to lint rules that have no lint level defined in the config", async () => {
			const fs = createNodeishMemoryFs()

			const config: ProjectConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["plugin.js", "lintRule.js"],
				settings: {},
			}

			await fs.writeFile("./project.inlang.json", JSON.stringify(config))

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(inlang.installed.lintRules()[0]?.lintLevel).toBe("warning")
		})

		// yep, this is a typical "hm, we have a bug here, let's write a test for it" test
		it("should return lint reports if disabled is not set", async () => {
			const _mockLintRule: LintRule = {
				type: "MessageLint",
				meta: {
					id: "lintRule.namespace.mock",
					description: { en: "Mock lint rule description" },
					displayName: { en: "Mock Lint Rule" },
				},
				message: ({ report }) => {
					report({
						messageId: "some-message-1",
						languageTag: "en",
						body: { en: "lintrule1" },
					})
				},
			}
			const _mockPlugin: Plugin = {
				meta: {
					id: "plugin.inlang.i18next",
					description: { en: "Mock plugin description" },
					displayName: { en: "Mock Plugin" },
				},
				loadMessages: () => [{ id: "some-message", selectors: [], variants: [] }],
				saveMessages: () => undefined,
			}
			const fs = await createNodeishMemoryFs()
			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["plugin.js", "lintRule.js"],
					settings: {},
				} satisfies ProjectConfig),
			)

			const _import: ImportFunction = async (name) => {
				return {
					default: name === "plugin.js" ? _mockPlugin : _mockLintRule,
				} satisfies InlangModule
			}
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(inlang.query.lintReports.getAll()).toHaveLength(1)
			expect(inlang.query.lintReports.getAll()?.[0]?.ruleId).toBe(_mockLintRule.meta.id)
			expect(inlang.installed.lintRules()).toHaveLength(1)
		})

		it("should return lint reports for a single message", async () => {
			const _mockLintRule: LintRule = {
				type: "MessageLint",
				meta: {
					id: "lintRule.namepsace.mock",
					description: { en: "Mock lint rule description" },
					displayName: { en: "Mock Lint Rule" },
				},
				message: ({ report }) => {
					report({
						messageId: "some-message",
						languageTag: "en",
						body: { en: "lintrule1" },
					})
				},
			}
			const _mockPlugin: Plugin = {
				meta: {
					id: "plugin.inlang.i18next",
					description: { en: "Mock plugin description" },
					displayName: { en: "Mock Plugin" },
				},
				loadMessages: () => [{ id: "some-message", selectors: [], variants: [] }],
				saveMessages: () => undefined,
			}
			const fs = await createNodeishMemoryFs()
			await fs.writeFile(
				"./inlang.config.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["plugin.js", "lintRule.js"],
					settings: {},
				} satisfies ProjectConfig),
			)
			const _import: ImportFunction = async (name) => {
				return {
					default: name === "plugin.js" ? _mockPlugin : _mockLintRule,
				} satisfies InlangModule
			}

			const inlang = await openInlangProject({
				projectFilePath: "./inlang.config.json",
				nodeishFs: fs,
				_import,
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(inlang.query.lintReports.get({ where: { messageId: "some-message" } })).toHaveLength(1)
		})
	})

	describe("errors", () => {
		it("should return the errors", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})
			inlang.errors.subscribe((errors) => {
				expect(errors).toStrictEqual([])
			})
		})
	})

	describe("customApi", () => {
		it("should return the app specific api", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			inlang.customApi.subscribe((api) => {
				expect(api["app.inlang.ideExtension"]).toBeDefined()
			})
		})
	})

	describe("messages", () => {
		it("should return the messages", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			expect(Object.values(inlang.query.messages.getAll())).toEqual(exampleMessages)
		})
	})

	describe("query", () => {
		it("updates should trigger the plugin persistence", async () => {
			const fs = await createNodeishMemoryFs()

			await fs.writeFile(
				"./project.inlang.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
					modules: ["plugin.js"],
					settings: {
						"plugin.inlang.json": {
							pathPattern: "./resources/{languageTag}.json",
						},
					},
				}),
			)

			await fs.mkdir("./resources")

			const mockSaveFn = vi.fn()

			const _mockPlugin: Plugin = {
				meta: {
					id: "plugin.inlang.json",
					description: { en: "Mock plugin description" },
					displayName: { en: "Mock Plugin" },
				},
				loadMessages: () => exampleMessages,
				saveMessages: mockSaveFn,
			}

			const _import = async () => {
				return {
					default: _mockPlugin,
				} satisfies InlangModule
			}

			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})

			await inlang.query.messages.upsert({
				where: { id: "a" },
				data: {
					id: "a",
					selectors: [],
					variants: [
						{
							languageTag: "en",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "a en",
								},
							],
						},
						{
							languageTag: "de",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "a de",
								},
							],
						},
					],
				},
			})

			await inlang.query.messages.upsert({
				where: { id: "b" },
				data: {
					id: "b",
					selectors: [],
					variants: [
						{
							languageTag: "en",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "b en",
								},
							],
						},

						{
							languageTag: "de",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "b de",
								},
							],
						},
					],
				},
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(mockSaveFn.mock.calls.length).toBe(1)

			expect(mockSaveFn.mock.calls[0][0].settings).toStrictEqual({
				pathPattern: "./resources/{languageTag}.json",
			})

			expect(Object.values(mockSaveFn.mock.calls[0][0].messages)).toStrictEqual([
				{
					id: "a",
					selectors: [],
					variants: [
						{
							languageTag: "en",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "a en",
								},
							],
						},
						{
							languageTag: "de",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "a de",
								},
							],
						},
					],
				},
				{
					id: "b",
					selectors: [],
					variants: [
						{
							languageTag: "en",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "b en",
								},
							],
						},
						{
							languageTag: "de",
							match: {},
							pattern: [
								{
									type: "Text",
									value: "b de",
								},
							],
						},
					],
				},
			])
		})
	})

	describe("lint", () => {
		it.todo("should throw if lint reports are not initialized yet", async () => {
			const fs = await createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import,
			})
			// TODO: test with real lint rules
			try {
				inlang.query.lintReports.getAll.subscribe((r) => expect(r).toEqual(undefined))
				throw new Error("Should not reach this")
			} catch (e) {
				expect((e as Error).message).toBe("lint not initialized yet")
			}
		})
		it("should return the lint reports", async () => {
			const config: ProjectConfig = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["lintRule.js"],
				settings: {},
			}
			const fs = createNodeishMemoryFs()
			await fs.writeFile("./project.inlang.json", JSON.stringify(config))
			const inlang = await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: async () => ({
					default: mockLintRule,
				}),
			})
			// TODO: test with real lint rules
			inlang.query.lintReports.getAll.subscribe((r) => expect(r).toEqual(undefined))
		})
	})
})
