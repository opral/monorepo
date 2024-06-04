/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import type { ImportFunction } from "../resolve-modules/index.js"
import { createEffect, from, createRoot } from "../reactivity/solid.js"
import { solidAdapter } from "./solidAdapter.js"
import { loadProject } from "../loadProject.js"
import { mockRepo } from "@lix-js/client"
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

const configWithAliases: ProjectSettings = {
	...config,
	experimental: { aliases: true },
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
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
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
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
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
		const repo = await mockRepo()
		const fs = repo.nodeishFs
		await fs.mkdir("/user/project.inlang", { recursive: true })
		await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import: $import,
			}),
			{ from }
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
		await new Promise((resolve) => setTimeout(resolve, 510))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(project.settings()).toStrictEqual(newConfig)
	})
})

describe("installed", () => {
	it("react to changes that are unrelated to installed items", async () => {
		const repo = await mockRepo()
		const fs = repo.nodeishFs
		await fs.mkdir("/user/project.inlang", { recursive: true })
		await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import: $import,
			}),
			{ from }
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

		expect(counterPlugins).toBe(3) // 3 times because effect creation + setSettings, setResolvedModules
		expect(counterLint).toBe(3) // 3 times because effect creation + setSettings, setResolvedModules
	})
})

describe("messages", () => {
	it("should react to changes in config", async () => {
		const repo = await mockRepo()
		const fs = repo.nodeishFs
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

			loadMessages: ({ settings }) => (settings.languageTags.length ? exampleMessages : []),
			saveMessages: () => undefined,
		}

		const mockImport: ImportFunction = async () => ({ default: mockPlugin })

		await fs.mkdir("/user/project.inlang.inlang", { recursive: true })
		await fs.writeFile("/user/project.inlang.inlang/settings.json", JSON.stringify(mockConfig))
		const project = solidAdapter(
			await loadProject({
				projectPath: "/user/project.inlang.inlang",
				repo,
				_import: mockImport,
			}),
			{ from }
		)

		let effectOnMessagesCounter = -1
		createEffect(() => {
			project.query.messages.getAll()
			effectOnMessagesCounter += 1
		})

		expect(Object.values(project.query.messages.getAll()).length).toBe(2)

		project.setSettings({ ...project.settings()!, languageTags: ["en"] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 510))

		expect(effectOnMessagesCounter).toBe(2) // 2 = setSetting (clearing the message index), subsequencial loadMessage call
		expect(Object.values(project.query.messages.getAll()).length).toBe(2)
	})

	it("should react to message udpate", async () => {
		const repo = await mockRepo()
		const fs = repo.nodeishFs
		await fs.mkdir("/user/project.inlang.inlang", { recursive: true })
		await fs.writeFile("/user/project.inlang.inlang/settings.json", JSON.stringify(config))
		const project = solidAdapter(
			await loadProject({
				projectPath: "/user/project.inlang.inlang",
				repo,
				_import: $import,
			}),
			{ from }
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
			).value
		).toBe("test")

		project.query.messages.update({
			where: { id: "a" },
			// TODO: use `createMessage` utility
			data: {
				...exampleMessages[0],
				variants: [
					{
						languageTag: "en",
						match: [],
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

		it("should react to message udpate (with aliases)", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang.inlang", { recursive: true })
			await fs.writeFile(
				"/user/project.inlang.inlang/settings.json",
				JSON.stringify(configWithAliases)
			)
			const project = solidAdapter(
				await loadProject({
					projectPath: "/user/project.inlang.inlang",
					repo,
					_import: $import,
				}),
				{ from }
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
					Object.values(messagesBefore())[0]?.variants.find(
						(variant) => variant.languageTag === "en"
					)?.pattern[0] as Text
				).value
			).toBe("test")

			project.query.messages.update({
				where: { id: "raw_tapir_pause_grateful" },
				// TODO: use `createMessage` utility
				data: {
					...exampleMessages[0],
					variants: [
						{
							languageTag: "en",
							match: [],
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
					Object.values(messagesAfter())[0]?.variants.find(
						(variant) => variant.languageTag === "en"
					)?.pattern[0] as Text
				).value
			).toBe("test2")
		})

		expect(counter).toBe(2) // 2 times because effect creation + set
		const messagesAfter = project.query.messages.getAll
		expect(Object.values(messagesAfter()).length).toBe(2)
		expect(
			(
				Object.values(messagesAfter())[0]?.variants.find((variant) => variant.languageTag === "en")
					?.pattern[0] as Text
			).value
		).toBe("test2")
	})
})

describe("lint", () => {
	it("should react to changes in config", async () => {
		await createRoot(async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(config))
			const project = solidAdapter(
				await loadProject({
					projectPath: "/user/project.inlang",
					repo,
					_import: $import,
				}),
				{ from }
			)

			// set counter to -1 since creating effect will execute once
			let counter = -1
			createEffect(() => {
				project.query.messageLintReports.getAll()
				counter += 1
			})

			expect(counter).toBe(0)

			// wait for all int reports beeing executed
			await new Promise((resolve) => setTimeout(resolve, 510))

			// 1 because we batch the two lint rules
			expect(counter).toBe(1)

			const currentSettings = project.settings()!
			const newConfig = { ...currentSettings, languageTags: ["en", "de"] }
			project.setSettings(newConfig)

			// set settings trigges synchronous -> +1
			expect(counter).toBe(2)

			await new Promise((resolve) => setTimeout(resolve, 510))

			// 4 = 2 + batched(1 (effect->settings) and  1 (effect->Resolved Plugin))
			expect(counter).toBe(3)
			expect(project.query.messageLintReports.getAll()).toEqual([])

			await new Promise((resolve) => setTimeout(resolve, 510))

			const newConfig2 = { ...project.settings()!, languageTags: ["en", "de", "fr"] }
			project.setSettings(newConfig2)

			// set settings trigges synchronous -> +1
			expect(counter).toBe(4)

			await new Promise((resolve) => setTimeout(resolve, 510))

			// 5 -> 4 + 1 new lint report batch
			expect(counter).toBe(5)
			expect(project.query.messageLintReports.getAll()).toEqual([])
		})
	})

	it.todo("should react to changes to packages")
	it.todo("should react to changes to modules")

	it("should react to changes to messages", async () => {
		await createRoot(async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(config))
			const project = solidAdapter(
				await loadProject({
					projectPath: "/user/project.inlang",
					repo,
					_import: $import,
				}),
				{ from }
			)

			let counter = -1 // -1 to start counting after the initial effect
			createEffect(() => {
				project.query.messageLintReports.getAll()
				counter += 1
			})
			expect(counter).toBe(0)

			await new Promise((resolve) => setTimeout(resolve, 510))
			// 1 -> lint rules are batched - we expect one signal on getAll
			expect(counter).toBe(1)

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "new" }] }],
				},
			})
			await new Promise((resolve) => setTimeout(resolve, 510))

			// 1 -> previous two messages + 0 - report results are the same - no effect
			expect(counter).toBe(1)
			expect(project.query.messageLintReports.getAll()).toEqual([])

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			// 2 -> the updated message does not update the lint rules - result is the same
			expect(counter).toBe(1)
			expect(project.query.messageLintReports.getAll()).toEqual([])
		})
	})
})
