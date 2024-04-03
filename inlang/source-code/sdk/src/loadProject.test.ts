/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi } from "vitest"
import { loadProject } from "./loadProject.js"
import type {
	ProjectSettings,
	Plugin,
	MessageLintRule,
	Message,
	NodeishFilesystemSubset,
} from "./versionedInterfaces.js"
import type { ImportFunction } from "./resolve-modules/index.js"
import type { InlangModule } from "@inlang/module"
import {
	LoadProjectInvalidArgument,
	ProjectSettingsFileJSONSyntaxError,
	ProjectSettingsFileNotFoundError,
	ProjectSettingsInvalidError,
} from "./errors.js"
import { normalizePath } from "@lix-js/fs"
import { createMessage } from "./test-utilities/createMessage.js"
import { tryCatch } from "@inlang/result"
import { mockRepo } from "@lix-js/client"
import { type Snapshot } from "@lix-js/fs"
// eslint-disable-next-line no-restricted-imports -- test
import { readFileSync } from "node:fs"
// eslint-disable-next-line no-restricted-imports -- test
import { resolve } from "node:path"

// ------------------------------------------------------------------------------------------------

const getValue = <T>(subscribable: { subscribe: (subscriber: (value: T) => void) => void }): T => {
	let value: T
	subscribable.subscribe((v) => void (value = v))
	return value!
}

const settings: ProjectSettings = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["plugin.js", "lintRule.js"],
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
	saveMessages: () => undefined as any,
	addCustomApi: () => ({
		"app.project.ideExtension": {
			messageReferenceMatcher: (text: string) => text as any,
		},
	}),
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

const exampleAliasedMessages: Message[] = [
	{
		id: "raw_tapir_pause_grateful",
		alias: {
			default: "a",
		},
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
		id: "dizzy_halibut_dial_vaguely",
		alias: {
			default: "b",
		},
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

const mockMessageLintRule: MessageLintRule = {
	id: "messageLintRule.project.mock",
	description: { en: "Mock lint rule description" },
	displayName: { en: "Mock Lint Rule" },
	run: () => undefined,
}

const _import: ImportFunction = async (name) =>
	({
		default: name === "plugin.js" ? mockPlugin : mockMessageLintRule,
	} satisfies InlangModule)

const ciTestRepoSnapshot = JSON.parse(
	readFileSync(resolve(__dirname, "../mocks/ci-test-repo-no-shallow.json"), {
		encoding: "utf-8",
	})
) as Snapshot

// ------------------------------------------------------------------------------------------------

/**
 * Dear Developers,
 *
 * Inlang projects (folders) are not like .vscode, .git, or .github folders. Treat em
 * like files: they can be renamed and moved around.
 */
it("should throw if a project (path) does not have a name", async () => {
	const repo = await mockRepo()
	const project = await tryCatch(() =>
		loadProject({
			projectPath: "/source-code/.inlang",
			repo,
			_import,
		})
	)
	expect(project.error).toBeInstanceOf(LoadProjectInvalidArgument)
})

it("should throw if a project path does not end with .inlang", async () => {
	const repo = await mockRepo()

	const invalidPaths = [
		"/source-code/frontend.inlang/settings",
		"/source-code/frontend.inlang/settings.json",
		"/source-code/frontend.inlang.md",
	]

	for (const invalidPath of invalidPaths) {
		const project = await tryCatch(() =>
			loadProject({
				projectPath: invalidPath,
				repo,
				_import,
			})
		)
		expect(project.error).toBeInstanceOf(LoadProjectInvalidArgument)
	}
})

describe("initialization", () => {
	it("should throw if projectPath is not an absolute path", async () => {
		const repo = await mockRepo()

		const result = await tryCatch(() =>
			loadProject({
				projectPath: "relative/path",
				repo,
				_import,
			})
		)
		expect(result.error).toBeInstanceOf(LoadProjectInvalidArgument)
		expect(result.data).toBeUndefined()
	})

	it("should generate projectId on missing projectid", async () => {
		const repo = await mockRepo({ fromSnapshot: ciTestRepoSnapshot })

		const existing = await repo.nodeishFs
			.readFile("/project.inlang/project_id", {
				encoding: "utf-8",
			})
			.catch((error) => {
				return { error }
			})

		// @ts-ignore
		expect(existing.error.code).toBe("ENOENT")

		const result = await tryCatch(() =>
			loadProject({
				projectPath: "/project.inlang",
				repo,
				_import,
			})
		)

		const newId = await repo.nodeishFs
			.readFile("/project.inlang/project_id", {
				encoding: "utf-8",
			})
			.catch((error) => {
				return { error }
			})

		expect(newId).toBe("aef225403be8b526dfb492a4617fd59d8181e8fef2c7f4aff56ab299046e36ed")

		expect(result.error).toBeUndefined()
		expect(result.data).toBeDefined()
	})

	it("should reuse projectId on existing projectid", async () => {
		const repo = await mockRepo({ fromSnapshot: ciTestRepoSnapshot })

		await repo.nodeishFs.writeFile("/project.inlang/project_id", "testId")

		const result = await tryCatch(() =>
			loadProject({
				projectPath: "/project.inlang",
				repo,
				_import,
			})
		)

		const newId = await repo.nodeishFs
			.readFile("/project.inlang/project_id", {
				encoding: "utf-8",
			})
			.catch((error) => {
				return { error }
			})

		expect(newId).toBe("testId")

		expect(result.error).toBeUndefined()
		expect(result.data).toBeDefined()
	})

	it("should resolve from a windows path", async () => {
		const repo = await mockRepo()
		const fs = repo.nodeishFs
		fs.mkdir("C:\\Users\\user\\project.inlang", { recursive: true })
		fs.writeFile("C:\\Users\\user\\project.inlang\\settings.json", JSON.stringify(settings))

		const result = await tryCatch(() =>
			loadProject({
				projectPath: "C:\\Users\\user\\project.inlang",
				repo,
				_import,
			})
		)

		expect(result.error).toBeUndefined()
		expect(result.data).toBeDefined()
	})

	describe("settings", () => {
		it("should return an error if settings file is not found", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			fs.mkdir("/user/project", { recursive: true })

			const project = await loadProject({
				projectPath: "/user/non-existend-project.inlang",
				repo,
				_import,
			})

			expect(project.errors()![0]).toBeInstanceOf(ProjectSettingsFileNotFoundError)
		})

		it("should return an error if settings file is not a valid JSON", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", "invalid json")

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.errors()![0]).toBeInstanceOf(ProjectSettingsFileJSONSyntaxError)
		})

		it("should return an error if settings file is does not match schema", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify({}))

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.errors()![0]).toBeInstanceOf(ProjectSettingsInvalidError)
		})

		it("should return the parsed settings", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.settings()).toStrictEqual(settings)
		})

		it("should not re-write the settings to disk when initializing", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			const settingsWithDeifferentFormatting = JSON.stringify(settings, undefined, 4)
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", settingsWithDeifferentFormatting)

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			const settingsOnDisk = await fs.readFile("/user/project.inlang/settings.json", {
				encoding: "utf-8",
			})
			expect(settingsOnDisk).toBe(settingsWithDeifferentFormatting)

			project.setSettings(project.settings())
			// TODO: how can we await `setsettings` correctly
			await new Promise((resolve) => setTimeout(resolve, 0))

			const newsettingsOnDisk = await fs.readFile("/user/project.inlang/settings.json", {
				encoding: "utf-8",
			})
			expect(newsettingsOnDisk).not.toBe(settingsWithDeifferentFormatting)
		})
	})

	describe("modules", () => {
		it("should return an error if an error occurs while resolving a plugin", async () => {
			const $badImport: ImportFunction = async () =>
				({
					default: {} as Plugin,
				} satisfies InlangModule)

			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import: $badImport,
			})

			expect(project.errors()).not.toHaveLength(0)
		})
		// 	it.todo("should throw if lintRules contain errors ???")
		// 	it.todo("should return meta data")
		// 	it.todo("should return plugins")
		// 	it.todo("should return lint rules")
	})

	describe("flow", () => {
		it.todo("should not call functions multiple times")
		it.todo("should load modules after settings")
		it.todo("should not load messages")
		it.todo("should not call lint")
	})

	describe("instance object", () => {
		it.todo("should contain all fields")
	})
})

describe("functionality", () => {
	describe("settings", () => {
		it("should return the settings", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(getValue(project.settings)).toStrictEqual(settings)
		})

		it("should set a new settings", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.settings()).toStrictEqual(settings)

			project.setSettings({ ...settings, languageTags: ["en", "de"] })
			expect(getValue(project.settings)).toStrictEqual({ ...settings, languageTags: ["en", "de"] })
			expect(project.settings()!.languageTags).toStrictEqual(["en", "de"])

			project.setSettings({ ...settings, languageTags: ["en", "de", "fr"] })
			expect(getValue(project.settings)).toStrictEqual({
				...settings,
				languageTags: ["en", "de", "fr"],
			})
			expect(project.settings()!.languageTags).toStrictEqual(["en", "de", "fr"])
		})
	})

	describe("setSettings", () => {
		it("should fail if settings are not valid", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			const result = project.setSettings({} as ProjectSettings)
			expect(result.data).toBeUndefined()
			expect(result.error).toBeInstanceOf(ProjectSettingsInvalidError)
		})

		it("should throw an error if sourceLanguageTag is not in languageTags", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })

			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["de"],
				modules: [],
			}

			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.errors()).toHaveLength(1)
			expect(project.errors()![0]).toBeInstanceOf(ProjectSettingsInvalidError)
		})

		it("should write settings to disk", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			const before = await fs.readFile("/user/project.inlang/settings.json", { encoding: "utf-8" })
			expect(before).toBeDefined()

			const result = project.setSettings({ ...settings, languageTags: ["en", "nl", "de"] })
			expect(result.data).toBeUndefined()
			expect(result.error).toBeUndefined()

			// TODO: how to wait for fs.writeFile to finish?
			await new Promise((resolve) => setTimeout(resolve, 50))

			const after = await fs.readFile("/user/project.inlang/settings.json", { encoding: "utf-8" })
			expect(after).toBeDefined()
			expect(after).not.toBe(before)
		})
	})

	describe("installed", () => {
		it("should return the installed items", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["plugin.js", "lintRule.js"],
			}
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.installed.plugins()[0]).toStrictEqual({
				id: mockPlugin.id,
				description: mockPlugin.description,
				displayName: mockPlugin.displayName,
				module: settings.modules[0],
				settingsSchema: mockPlugin.settingsSchema,
			})

			expect(project.installed.messageLintRules()[0]).toEqual({
				id: mockMessageLintRule.id,
				description: mockMessageLintRule.description,
				displayName: mockMessageLintRule.displayName,
				module: settings.modules[1],
				level: "warning",
				settingsSchema: mockMessageLintRule.settingsSchema,
			})
		})

		it("should apply 'warning' as default lint level to lint rules that have no lint level defined in the settings", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs

			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["plugin.js", "lintRule.js"],
			}

			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(project.installed.messageLintRules()[0]?.level).toBe("warning")
		})

		// yep, this is a typical "hm, we have a bug here, let's write a test for it" test
		it("should return lint reports if disabled is not set", async () => {
			const _mockLintRule: MessageLintRule = {
				id: "messageLintRule.namespace.mock",
				description: { en: "Mock lint rule description" },
				displayName: { en: "Mock Lint Rule" },
				run: ({ report }) => {
					report({
						messageId: "some-message-1",
						languageTag: "en",
						body: { en: "lintrule1" },
					})
				},
			}
			const _mockPlugin: Plugin = {
				id: "plugin.project.i18next",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },

				loadMessages: () => [{ id: "some-message", alias: {}, selectors: [], variants: [] }],
				saveMessages: () => undefined,
			}
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile(
				"/user/project.inlang/settings.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["plugin.js", "lintRule.js"],
				} satisfies ProjectSettings)
			)

			const _import: ImportFunction = async (name) => {
				return {
					default: name === "plugin.js" ? _mockPlugin : _mockLintRule,
				} satisfies InlangModule
			}
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(await project.query.messageLintReports.getAll()).toHaveLength(1)
			expect((await project.query.messageLintReports.getAll())?.[0]?.ruleId).toBe(_mockLintRule.id)
			expect(project.installed.messageLintRules()).toHaveLength(1)
		})

		it("should return lint reports for a single message", async () => {
			const _mockLintRule: MessageLintRule = {
				id: "messageLintRule.namepsace.mock",
				description: { en: "Mock lint rule description" },
				displayName: { en: "Mock Lint Rule" },

				run: ({ report }) => {
					report({
						messageId: "some-message",
						languageTag: "en",
						body: { en: "lintrule1" },
					})
				},
			}
			const _mockPlugin: Plugin = {
				id: "plugin.project.i18next",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },

				loadMessages: () => [{ id: "some-message", alias: {}, selectors: [], variants: [] }],
				saveMessages: () => undefined,
			}
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile(
				"/user/project.inlang/settings.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en"],
					modules: ["plugin.js", "lintRule.js"],
				} satisfies ProjectSettings)
			)
			const _import: ImportFunction = async (name) => {
				return {
					default: name === "plugin.js" ? _mockPlugin : _mockLintRule,
				} satisfies InlangModule
			}

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(
				await project.query.messageLintReports.get({ where: { messageId: "some-message" } })
			).toHaveLength(1)
		})
	})

	describe("errors", () => {
		it("should return the errors", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})
			project.errors.subscribe((errors) => {
				expect(errors).toStrictEqual([])
			})
		})
	})

	describe("customApi", () => {
		it("should return the app specific api", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			project.customApi.subscribe((api) => {
				expect(api["app.project.ideExtension"]).toBeDefined()
			})
		})
	})

	describe("messages", () => {
		it("should return the messages", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(Object.values(project.query.messages.getAll())).toEqual(exampleMessages)
		})
	})

	describe("messages with aliases", () => {
		it("should return the messages", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile(
				"/user/project.inlang/settings.json",
				JSON.stringify({ ...settings, experimental: { aliases: true } })
			)
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			expect(Object.values(project.query.messages.getAll())).toEqual(exampleAliasedMessages)
		})
	})

	describe("query", () => {
		it("should call saveMessages() on updates", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs

			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en", "de"],
				modules: ["plugin.js"],
				"plugin.project.json": {
					pathPattern: "./resources/{languageTag}.json",
				},
			}

			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))

			await fs.mkdir("./resources")

			const mockSaveFn = vi.fn()

			const _mockPlugin: Plugin = {
				id: "plugin.project.json",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },

				loadMessages: () => exampleMessages,
				saveMessages: mockSaveFn,
			}

			const _import = async () => {
				return {
					default: _mockPlugin,
				} satisfies InlangModule
			}

			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import,
			})

			await project.query.messages.upsert({
				where: { id: "a" },
				data: {
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
									value: "a en",
								},
							],
						},
						{
							languageTag: "de",
							match: [],
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

			await project.query.messages.upsert({
				where: { id: "b" },
				data: {
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
									value: "b en",
								},
							],
						},
						{
							languageTag: "de",
							match: [],
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

			// lets wait for the next tick
			await new Promise((resolve) => setTimeout(resolve, 100))

			expect(mockSaveFn.mock.calls.length).toBe(1)

			expect(mockSaveFn.mock.calls[0][0].settings).toStrictEqual(settings)

			expect(Object.values(mockSaveFn.mock.calls[0][0].messages)).toStrictEqual([
				{
					id: "a",
					alias: {},
					selectors: [],
					variants: [
						{
							languageTag: "de",
							match: [],
							pattern: [
								{
									type: "Text",
									value: "a de",
								},
							],
						},
						{
							languageTag: "en",
							match: [],
							pattern: [
								{
									type: "Text",
									value: "a en",
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
							languageTag: "de",
							match: [],
							pattern: [
								{
									type: "Text",
									value: "b de",
								},
							],
						},
						{
							languageTag: "en",
							match: [],
							pattern: [
								{
									type: "Text",
									value: "b en",
								},
							],
						},
					],
				},
			])
		})

		/*
		 * Passing all messages to saveMessages() simplifies plugins by an order of magnitude.
		 *
		 * The alternative would be to pass only the messages that changed to saveMessages().
		 * But, this would require plugins to maintain a separate data structure of messages
		 * and create optimizations, leading to (unjustified) complexity for plugin authors.
		 *
		 * Pros:
		 *   - plugins don't need to transform the data (time complexity).
		 *   - plugins don't to maintain a separate data structure (space complexity).
		 *   - plugin authors don't need to deal with optimizations (ecosystem complexity).
		 *
		 * Cons:
		 *  - Might be slow for a large number of messages. The requirement hasn't popped up yet though.
		 */
		it("should pass all messages, regardless of which message changed, to saveMessages()", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs

			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en", "de"],
				modules: ["plugin.js"],
				"plugin.placeholder.name": {
					pathPattern: "./resources/{languageTag}.json",
				},
			}

			await fs.mkdir("./project.inlang", { recursive: true })
			await fs.writeFile("./project.inlang/settings.json", JSON.stringify(settings))

			const mockSaveFn = vi.fn()

			const _mockPlugin: Plugin = {
				id: "plugin.placeholder.name",
				description: "Mock plugin description",
				displayName: "Mock Plugin",

				loadMessages: () => [
					createMessage("first", { en: "first message" }),
					createMessage("second", { en: "second message" }),
					createMessage("third", { en: "third message" }),
				],
				saveMessages: mockSaveFn,
			}

			const _import = async () => {
				return {
					default: _mockPlugin,
				} satisfies InlangModule
			}

			const project = await loadProject({
				projectPath: "/project.inlang",
				repo,
				_import,
			})

			project.query.messages.create({ data: createMessage("fourth", { en: "fourth message" }) })

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(mockSaveFn.mock.calls.length).toBe(1)
			expect(mockSaveFn.mock.calls[0][0].messages).toHaveLength(4)

			project.query.messages.create({ data: createMessage("fifth", { en: "fifth message" }) })

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(mockSaveFn.mock.calls.length).toBe(2)
			expect(mockSaveFn.mock.calls[1][0].messages).toHaveLength(5)

			project.query.messages.delete({ where: { id: "fourth" } })

			await new Promise((resolve) => setTimeout(resolve, 510))

			expect(mockSaveFn.mock.calls.length).toBe(3)
			expect(mockSaveFn.mock.calls[2][0].messages).toHaveLength(4)
		})
	})

	describe("lint", () => {
		it.todo("should throw if lint reports are not initialized yet", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project", { recursive: true })
			await fs.writeFile("/user/project/project.inlang.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project/project.inlang.json",
				repo,
				_import,
			})
			// TODO: test with real lint rules
			try {
				const r = await project.query.messageLintReports.getAll()
				expect(r).toEqual(undefined)
				throw new Error("Should not reach this")
			} catch (e) {
				expect((e as Error).message).toBe("lint not initialized yet")
			}
		})
		it("should return the message lint reports", async () => {
			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["lintRule.js"],
			}
			const repo = await mockRepo()
			const fs = repo.nodeishFs
			await fs.mkdir("/user/project.inlang", { recursive: true })
			await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))
			const project = await loadProject({
				projectPath: "/user/project.inlang",
				repo,
				_import: async () => ({
					default: mockMessageLintRule,
				}),
			})
			// TODO: test with real lint rules
			const r = await project.query.messageLintReports.getAll()
			expect(r).toEqual([])
		})
	})

	describe("watcher", () => {
		it("changing files in resources should trigger callback of message query", async () => {
			const repo = await mockRepo()
			const fs = repo.nodeishFs

			const messages = {
				$schema: "https://inlang.com/schema/inlang-message-format",
				data: [
					{
						id: "test",
						selectors: [],
						variants: [
							{
								match: [],
								languageTag: "en",
								pattern: [
									{
										type: "Text",
										value: "test",
									},
								],
							},
						],
					},
				],
			}

			await fs.writeFile("./messages.json", JSON.stringify(messages))

			const getMessages = async (customFs: NodeishFilesystemSubset) => {
				const file = await customFs.readFile("./messages.json", { encoding: "utf-8" })
				return JSON.parse(file.toString()).data
			}

			const mockMessageFormatPlugin: Plugin = {
				id: "plugin.inlang.messageFormat",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },

				loadMessages: async (args) => await getMessages(args.nodeishFs),
				saveMessages: () => undefined as any,
			}

			const settings: ProjectSettings = {
				sourceLanguageTag: "en",
				languageTags: ["en"],
				modules: ["plugin.js"],
				"plugin.inlang.messageFormat": {
					filePath: "./messages.json",
				},
			}

			await fs.mkdir("./project.inlang", { recursive: true })
			await fs.writeFile("./project.inlang/settings.json", JSON.stringify(settings))

			// establish watcher
			const project = await loadProject({
				projectPath: normalizePath("/project.inlang"),
				repo,
				_import: async () => ({
					default: mockMessageFormatPlugin,
				}),
			})

			let counter = 0

			project.query.messages.getAll.subscribe(() => {
				counter = counter + 1
			})

			// subscribe fires once
			expect(counter).toBe(1)

			// saving the file without changing should not trigger a message query
			await fs.writeFile("./messages.json", JSON.stringify(messages))
			await new Promise((resolve) => setTimeout(resolve, 200)) // file event will lock a file and be handled sequentially - give it time to pickup the change

			// we didn't change the message we write into message.json - shouldn't change the messages
			expect(counter).toBe(1)

			// saving the file without changing should trigger a change
			messages.data[0]!.variants[0]!.pattern[0]!.value = "changed"
			await fs.writeFile("./messages.json", JSON.stringify(messages))
			await new Promise((resolve) => setTimeout(resolve, 200)) // file event will lock a file and be handled sequentially - give it time to pickup the change

			expect(counter).toBe(2)

			messages.data[0]!.variants[0]!.pattern[0]!.value = "changed3"

			// change file
			await fs.writeFile("./messages.json", JSON.stringify(messages))
			await new Promise((resolve) => setTimeout(resolve, 200)) // file event will lock a file and be handled sequentially - give it time to pickup the change

			expect(counter).toBe(3)
		})
	})
})
