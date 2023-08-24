import { describe, it, expect } from "vitest"
import { createMockNodeishFs } from "@inlang/plugin/test"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin, Text } from "@inlang/plugin"
import type { ImportFunction, InlangModule } from "@inlang/module"
import { createEffect, from } from "../solid.js"
import { withSolidReactivity } from "./withSolidReactivity.js"
import type { LintRule } from "@inlang/lint"
import { openInlangProject } from "../openInlangProject.js"

// ------------------------------------------------------------------------------------------------

const config: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["./dist/index.js"],
	settings: {
		"project.lintRuleLevels": {
			"inlang.lintRule.missingTranslation": "error",
		},
		"inlang.plugin.i18next": {
			pathPattern: "./examples/example01/{languageTag}.json",
			variableReferencePattern: ["{", "}"],
		},
	},
}

const mockPlugin: Plugin = {
	meta: {
		id: "inlang.plugin.i18next",
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
		id: "namespace.lintRule.mock",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	message: () => undefined,
}

const $import: ImportFunction = async () =>
	({
		default: {
			plugins: [mockPlugin],
			lintRules: [mockLintRule],
		},
	} satisfies InlangModule)

// ------------------------------------------------------------------------------------------------

describe("config", () => {
	it("should react to changes to config", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
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

		const newConfig = { ...inlang.config(), languageTags: ["en", "de"] }
		inlang.setConfig(newConfig)

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(inlang.config()).toStrictEqual(newConfig)
	})
})

describe("installed", () => {
	it("react to changes that are unrelated to installed items", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
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

		inlang.setConfig({ ...inlang.config(), languageTags: ["en", "fr"] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counterPlugins).toBe(2) // 2 times because effect creation + set
		expect(counterLint).toBe(2) // 2 times because effect creation + set
	})
})

describe("messages", () => {
	it("should react to changes to config", async () => {
		const fs = await createMockNodeishFs()
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: ["./plugin-a.js"],
			settings: {},
		}
		const mockPlugin: Plugin = {
			meta: {
				id: "mock.plugin.name",
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

		const mockImport: ImportFunction = async () =>
			({ default: { plugins: [mockPlugin] } } satisfies InlangModule)

		await fs.writeFile("./inlang.config.json", JSON.stringify(mockConfig))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
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

		inlang.setConfig({ ...inlang.config(), languageTags: [] })

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
		expect(Object.values(inlang.query.messages.getAll()).length).toBe(0)
	})

	it("should react to changes to messages", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
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
	it("should not react to changes to config if not initialized", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)

		let counter = 0
		createEffect(() => {
			inlang.lint.reports()
			counter += 1
		})

		const newConfig = { ...inlang.config(), languageTags: ["en", "de"] }
		inlang.setConfig(newConfig)

		expect(counter).toBe(1)
		expect(inlang.lint.reports()).toEqual([])
	})

	it("should react to changes to config", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = withSolidReactivity(
			await openInlangProject({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			}),
			{ from },
		)
		await inlang.lint.init()

		let counter = 0
		createEffect(() => {
			inlang.lint.reports()
			counter += 1
		})

		const newConfig = { ...inlang.config(), languageTags: ["en", "de"] }
		inlang.setConfig(newConfig)

		// TODO: how can we await `setConfig` correctly
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(2) // 2 times because effect creation + set
	})

	it.todo("should react to changes to modules")
	it.todo("should react to changes to messages")
})
