import { describe, it, expect } from "vitest"
import type { ImportFunction } from "../resolve-modules/index.js"
import { createEffect, from, createRoot } from "../reactivity/solid.js"
import { solidAdapter } from "./solidAdapter.js"
import { openInlangProject } from "../openInlangProject.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { Message, ProjectConfig, Plugin, LintRule, Text } from "../interfaces.js"

// ------------------------------------------------------------------------------------------------

const config: ProjectConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["plugin.js", "plugin.js"],
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
	saveMessages: () => undefined,
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
		id: "lintRule.namespace.mock",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	message: () => undefined,
}

const $import: ImportFunction = async (name) => ({
	default: name === "plugin.js" ? mockPlugin : mockLintRule,
})

// ------------------------------------------------------------------------------------------------

describe("config", () => {
	it("should react to changes to config", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const inlang = solidAdapter(
			await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			inlang.config()
			counter += 1
		})

		const newConfig = { ...inlang.config()!, languageTags: ["en", "de"] }
		inlang.setConfig(newConfig)

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(inlang.config()).toStrictEqual(newConfig)
	})
})

describe("installed", () => {
	it("react to changes that are unrelated to installed items", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const inlang = solidAdapter(
			await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)
		let counterPlugins = 0
		let counterLint = 0

		createEffect(() => {
			inlang.installed.plugins()
			counterPlugins += 1
		})

		createEffect(() => {
			inlang.installed.lintRules()
			counterLint += 1
		})

		inlang.setConfig({ ...inlang.config()!, languageTags: ["en", "fr"] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counterPlugins).toBe(2) // 2 times because effect creation + set
		expect(counterLint).toBe(2) // 2 times because effect creation + set
	})
})

describe("messages", () => {
	it("should react to changes to config", async () => {
		const fs = createNodeishMemoryFs()
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: ["./plugin-a.js"],
			settings: {},
		}
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.mock.id",
				displayName: {
					en: "hello",
				},
				description: {
					en: "wo",
				},
			},
			loadMessages: ({ languageTags }) => (languageTags.length ? exampleMessages : []),
			saveMessages: () => undefined,
		}

		const mockImport: ImportFunction = async () => ({ default: mockPlugin })

		await fs.writeFile("./project.inlang.json", JSON.stringify(mockConfig))
		const inlang = solidAdapter(
			await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: mockImport,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			inlang.query.messages.getAll()
			counter += 1
		})

		expect(Object.values(inlang.query.messages.getAll()).length).toBe(2)

		inlang.setConfig({ ...inlang.config()!, languageTags: [] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(Object.values(inlang.query.messages.getAll()).length).toBe(0)
	})

	it("should react to changes to messages", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const inlang = solidAdapter(
			await openInlangProject({
				projectFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			inlang.query.messages.getAll()
			counter += 1
		})

		const messagesBefore = inlang.query.messages.getAll
		expect(Object.values(messagesBefore()).length).toBe(2)
		expect(
			(
				Object.values(messagesBefore())[0]?.variants.find((variant) => variant.languageTag === "en")
					?.pattern[0] as Text
			).value,
		).toBe("test")

		inlang.query.messages.update({
			where: { id: "a" },
			// TODO: use `createMessage` utility
			data: {
				...exampleMessages[0],
				variants: [
					{
						languageTag: "en",
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
		})

		expect(counter).toBe(2) // 2 times because effect creation + set
		const messagesAfter = inlang.query.messages.getAll
		expect(Object.values(messagesAfter()).length).toBe(2)
		expect(
			(
				Object.values(messagesAfter())[0]?.variants.find((variant) => variant.languageTag === "en")
					?.pattern[0] as Text
			).value,
		).toBe("test2")
	})
})

describe("lint", () => {
	it.todo("should react to changes to config", async () => {
		await createRoot(async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = solidAdapter(
				await openInlangProject({
					projectFilePath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)

			let counter = 0
			createEffect(() => {
				inlang.query.lintReports.getAll()
				counter += 1
			})

			const newConfig = { ...inlang.config()!, languageTags: ["en", "de"] }
			inlang.setConfig(newConfig)

			expect(counter).toBe(1)
			expect(inlang.query.lintReports.getAll()).toEqual([])

			await new Promise((resolve) => setTimeout(resolve, 510))

			const newConfig2 = { ...inlang.config()!, languageTags: ["en", "de", "fr"] }
			inlang.setConfig(newConfig2)

			expect(counter).toBe(9)
			expect(inlang.query.lintReports.getAll()).toEqual([])
		})
	})

	it.todo("should react to changes to packages")
	it.todo("should react to changes to modules")

	it.todo("should react to changes to messages", async () => {
		await createRoot(async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = solidAdapter(
				await openInlangProject({
					projectFilePath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)

			let counter = 0
			createEffect(() => {
				inlang.query.lintReports.getAll()
				counter += 1
			})

			inlang.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			expect(counter).toBe(1)
			expect(inlang.query.lintReports.getAll()).toEqual([])

			await new Promise((resolve) => setTimeout(resolve, 510))

			inlang.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			expect(counter).toBe(6)
			expect(inlang.query.lintReports.getAll()).toEqual([])
		})
	})
})
