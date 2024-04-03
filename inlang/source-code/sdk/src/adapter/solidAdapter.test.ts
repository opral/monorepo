/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import type { ImportFunction } from "../resolve-modules/index.js"
import {
	createResource,
	createSignal,
	createEffect,
	from,
	createRoot,
} from "../reactivity/solid.js"
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

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

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

		expect(counterPlugins).toBe(2) // 2 times because effect creation + set
		expect(counterLint).toBe(2) // 2 times because effect creation + set
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

		let effectOnMessagesCounter = 0
		createEffect(() => {
			project.query.messages.getAll()
			effectOnMessagesCounter += 1
		})

		expect(Object.values(project.query.messages.getAll()).length).toBe(2)

		project.setSettings({ ...project.settings()!, languageTags: ["en"] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 510))

		expect(effectOnMessagesCounter).toBe(1) // 2 times because effect creation + set
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

			const [messages, setMessages] = createSignal<readonly Message[]>()

			let counter = 0

			createEffect(() => {
				setMessages(project.query.messages.getAll())
			})

			const [lintReports] = createResource(messages, async () => {
				const reports = await project.query.messageLintReports.getAll()
				counter += 1
				return reports
			})

			await sleep(10)
			expect(counter).toBe(1)
			expect(lintReports()).toStrictEqual([])

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			await sleep(10)
			expect(counter).toBe(2)
			expect(lintReports()).toStrictEqual([])

			project.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "new" }] }],
				},
			})

			await sleep(10)
			expect(counter).toBe(3)
			expect(lintReports()).toStrictEqual([])
		})
	})
})
