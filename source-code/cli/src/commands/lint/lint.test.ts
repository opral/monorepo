import { describe, it, expect, vi } from "vitest"
import { lintCommandAction } from "./index.js"
import {
	LintRule,
	Message,
	ProjectConfig,
	openInlangProject,
	Plugin,
	type InlangModule,
} from "@inlang/sdk"
import { createNodeishMemoryFs } from "@lix-js/fs"

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
						value: "title",
					},
				],
			},
			{
				languageTag: "de",
				match: {},
				pattern: [
					{
						type: "Text",
						value: "Titel",
					},
				],
			},
		],
	},
]

async function setupInlang(enabledLintRule?: LintRule) {
	const fs = createNodeishMemoryFs()

	await fs.writeFile(
		"./project.inlang.json",
		JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["en", "de", "it"],
			modules: [""],
			settings: {
				"project.lintRuleLevels": {},
			},
		} satisfies ProjectConfig),
	)

	const _mockPlugin: Plugin = {
		meta: {
			id: "plugin.inlang.json",
			description: { en: "Mock plugin description" },
			displayName: { en: "Mock Plugin" },
		},
		loadMessages: () => exampleMessages,
		saveMessages: () => undefined as any,
	}

	const _import = async () => {
		if (enabledLintRule) {
			return { default: enabledLintRule } satisfies InlangModule
		}
		return
	}

	return await openInlangProject({
		projectFilePath: "./project.inlang.json",
		nodeishFs: fs,
		_import,
	})
}

describe("lint command", () => {
	it("succeed on lint success", async () => {
		const enabledLintRule: LintRule = {
			type: "MessageLint",
			meta: {
				id: "lintRule.namespace.enabled",
				description: { en: "Mock lint rule description" },
				displayName: { en: "Mock Lint Rule" },
			},
			message: () => {
				;/ * no lint reports for this test case * /
			},
		}

		const inlang = await setupInlang(enabledLintRule)

		const logger = {
			log: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
		}

		let lintResult
		try {
			lintResult = await lintCommandAction({
				inlang,
				logger,
			})
		} catch (err) {
			console.error(err)
			/* */
		}

		expect(logger.error.mock.calls.length).toBe(0)
		expect(logger.success.mock.calls.length).toBe(1)
		expect(logger.log.mock.calls.length).toBe(0)
		expect(lintResult).toBe(undefined)
	})

	it("show lint reports", async () => {
		const enabledLintRule: LintRule = {
			type: "MessageLint",
			meta: {
				id: "lintRule.namespace.enabled",
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

		const inlang = await setupInlang(enabledLintRule)

		const logger = {
			log: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
		}

		let lintResult
		try {
			lintResult = await lintCommandAction({
				inlang,
				logger,
			})
		} catch (err) {
			console.error(err)
			/* */
		}

		expect(logger.error.mock.calls.length).toBe(0)
		expect(logger.success.mock.calls.length).toBe(0)
		expect(logger.log.mock.calls.length).toBeGreaterThan(1)
		expect(lintResult).toBeDefined()
		expect(lintResult?.lintTable.length).toBe(2)
	})

	it("error on missing lint rules", async () => {
		const inlang = await setupInlang()

		const logger = {
			log: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
		}

		let lintResult
		try {
			lintResult = await lintCommandAction({
				inlang,
				logger,
			})
		} catch (err) {
			console.error(err)
			/* */
		}

		expect(lintResult).toBe(undefined)
		expect(logger.error.mock.calls.length).toBe(1)
		expect(logger.success.mock.calls.length).toBe(0)
		expect(logger.log.mock.calls.length).toBe(0)

		// checks for an error message mentioning our config file, this seems good balance to be reliable but test the cli behaviour
		expect(logger.error.mock.calls[0][0]).toContain("project.inlang.json")
	})
})
