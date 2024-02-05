import * as main from "../src/main"
import * as core from "@actions/core"
import * as fs from "node:fs/promises"
import { MockInstance, beforeEach, describe, expect, it, vi } from "vitest"
import {
	MessageLintRule,
	Message,
	ProjectSettings,
	loadProject,
	Plugin,
	type InlangModule,
} from "@inlang/sdk"
import { mockRepo } from "@lix-js/client"

const exampleMessages: Message[] = [
	{
		id: "a",
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
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "title",
					},
				],
			},
			{
				languageTag: "de",
				match: [],
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

async function setupProject(enabledLintRule?: MessageLintRule) {
	const repo = await mockRepo()
	await fs.mkdir("project.inlang", { recursive: true })
	await fs.writeFile(
		"./project.inlang/settings.json",
		JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["en", "de", "it"],
			modules: ["_mockPlugin.js", ...(enabledLintRule ? ["lintRule.js"] : [])],
			messageLintRuleLevels: {},
		} satisfies ProjectSettings)
	)

	const _mockPlugin: Plugin = {
		id: "plugin.inlang.json",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
		loadMessages: () => exampleMessages,
		saveMessages: () => undefined as any,
	}

	const _import = async (name: string) => {
		if (name === "lintRule.js") {
			return { default: enabledLintRule as MessageLintRule } satisfies InlangModule
		}
		return {
			default: _mockPlugin,
		}
	}

	return await loadProject({
		projectPath: "/project.inlang",
		repo,
		_import,
	})
}

const runMock = vi.spyOn(main, "run")

// Mock the GitHub Actions core library
// let debugMock: MockInstance
// let errorMock: MockInstance
let getInputMock: MockInstance
// let setFailedMock: MockInstance
// let setOutputMock: MockInstance

describe("test", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		getInputMock = vi.spyOn(core, "getInput")
		// debugMock = vi.spyOn(core, "debug")
		// errorMock = vi.spyOn(core, "error")
		// setFailedMock = vi.spyOn(core, "setFailed")
		// setOutputMock = vi.spyOn(core, "setOutput")
	})

	it("runMock should return", async () => {
		const enabledLintRule: MessageLintRule = {
			id: "messageLintRule.namespace.enabled",
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

		await setupProject(enabledLintRule)

		// Set the action's inputs as return values from core.getInput()
		getInputMock.mockImplementation((name: string): string => {
			switch (name) {
				case "owner":
					return "nilsjacobsen"
				case "repo":
					return "test-repo-for-action"
				case "project_path":
					return "1"
				case "token":
					return process.env.GITHUB_TOKEN || ""
				case "projectPath":
					return "/project.inlang"
				default:
					return ""
			}
		})
		await main.run()
		expect(runMock).toHaveReturned()

		// cleanup
		await fs.rm("project.inlang", { recursive: true })
	})
})
