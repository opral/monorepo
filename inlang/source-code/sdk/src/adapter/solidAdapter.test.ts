/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import type { ImportFunction } from "../resolve-modules/index.js"
import { createEffect, from, createRoot } from "../reactivity/solid.js"
import { solidAdapter } from "./solidAdapter.js"
import { loadProject } from "../loadProject.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type {
	Message,
	ProjectSettings,
	Plugin,
	MessageLintRule,
	Text,
} from "../versionedInterfaces.js"

// ------------------------------------------------------------------------------------------------

const config: ProjectSettings = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["plugin.js", "plugin2.js"],
	messageLintRuleLevels: {
		"messageLintRule.project.missingTranslation": "error",
	},
	"plugin.project.i18next": {
		pathPattern: "./examples/example01/{languageTag}.json",
		variableReferencePattern: ["{", "}"],
	},
}

const mockPlugin: Plugin = {
	id: "plugin.project.i18next",
	description: { en: "Mock plugin description" },
	displayName: { en: "Mock Plugin" },
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

const mockLintRule: MessageLintRule = {
	id: "messageLintRule.namespace.mock",
	description: { en: "Mock lint rule description" },
	displayName: { en: "Mock Lint Rule" },
	run: () => undefined,
}

const $import: ImportFunction = async (name) => ({
	default: name === "plugin.js" ? mockPlugin : mockLintRule,
})

// ------------------------------------------------------------------------------------------------

describe("config", () => {
	it("should react to changes in config", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				settingsFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			project.settings()
			counter += 1
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const newConfig = { ...project.settings()!, languageTags: ["en", "de"] }

		project.setSettings(newConfig)
		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(project.settings()).toStrictEqual(newConfig)
	})
})

describe("installed", () => {
	it("react to changes that are unrelated to installed items", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				settingsFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)
		let counterPlugins = 0
		let counterLint = 0

		createEffect(() => {
			project.installed.plugins()
			counterPlugins += 1
		})

		createEffect(() => {
			project.installed.messageLintRules()
			counterLint += 1
		})

		project.setSettings({ ...project.settings()!, languageTags: ["en", "fr"] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counterPlugins).toBe(2) // 2 times because effect creation + set
		expect(counterLint).toBe(2) // 2 times because effect creation + set
	})
})

describe("messages", () => {
	it("should react to changes in config", async () => {
		const fs = createNodeishMemoryFs()
		const mockConfig: ProjectSettings = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: ["./plugin-a.js"],
			"library.project.paraglideJsSveltekit": {
				languageNegotiation: {
					strategies: [
						{
							type: "localStorage",
						} as any,
					],
				},
			},
		}
		const mockPlugin: Plugin = {
			id: "plugin.mock.id",
			displayName: {
				en: "hello",
			},
			description: {
				en: "wo",
			},
			loadMessages: ({ languageTags }) => (languageTags.length ? exampleMessages : []),
			saveMessages: () => undefined,
		}

		const mockImport: ImportFunction = async () => ({ default: mockPlugin })

		await fs.writeFile("./project.inlang.json", JSON.stringify(mockConfig))
		const project = solidAdapter(
			await loadProject({
				settingsFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: mockImport,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			project.query.messages.getAll()
			counter += 1
		})

		expect(Object.values(project.query.messages.getAll()).length).toBe(2)

		project.setSettings({ ...project.settings()!, languageTags: [] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(Object.values(project.query.messages.getAll()).length).toBe(0)
	})

	it("should react to changes in messages", async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("./project.inlang.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				settingsFilePath: "./project.inlang.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			project.query.messages.getAll()
			counter += 1
		})

		const messagesBefore = project.query.messages.getAll
		expect(Object.values(messagesBefore()).length).toBe(2)
		expect(
			(
				Object.values(messagesBefore())[0]?.variants.find((variant) => variant.languageTag === "en")
					?.pattern[0] as Text
			).value,
		).toBe("test")

		project.query.messages.update({
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
		const messagesAfter = project.query.messages.getAll
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
	it.todo("should react to changes in config", async () => {
		await createRoot(async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile("./project.config.json", JSON.stringify(config))
			const project = solidAdapter(
				await loadProject({
					settingsFilePath: "./project.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)

			let counter = 0
			createEffect(() => {
				project.query.messageLintReports.getAll()
				counter += 1
			})

			const newConfig = { ...project.settings()!, languageTags: ["en", "de"] }
			project.setSettings(newConfig)

			expect(counter).toBe(1)
			expect(project.query.messageLintReports.getAll()).toEqual([])

			await new Promise((resolve) => setTimeout(resolve, 510))

			const newConfig2 = { ...project.settings()!, languageTags: ["en", "de", "fr"] }
			project.setSettings(newConfig2)

			expect(counter).toBe(9)
			expect(project.query.messageLintReports.getAll()).toEqual([])
		})
	})

	it.todo("should react to changes to packages")
	it.todo("should react to changes to modules")

	it.todo("should react to changes to messages", async () => {
		await createRoot(async () => {
			const fs = createNodeishMemoryFs()
			await fs.writeFile("./project.config.json", JSON.stringify(config))
			const project = solidAdapter(
				await loadProject({
					settingsFilePath: "./project.config.json",
					nodeishFs: fs,
					_import: $import,
				}),
				{ from },
			)

			let counter = 0
			createEffect(() => {
				project.query.messageLintReports.getAll()
				counter += 1
			})

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			expect(counter).toBe(1)
			expect(project.query.messageLintReports.getAll()).toEqual([])

			await new Promise((resolve) => setTimeout(resolve, 510))

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			expect(counter).toBe(6)
			expect(project.query.messageLintReports.getAll()).toEqual([])
		})
	})
})
