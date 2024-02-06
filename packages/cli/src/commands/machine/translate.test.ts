import { test, expect } from "vitest"
import { translateCommandAction } from "./translate.js"
import { Message, ProjectSettings, loadProject, Plugin, type InlangModule } from "@inlang/sdk"
import { createMessage } from "@inlang/sdk/test-utilities"
import { mockRepo } from "@lix-js/client"

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"should tanslate the missing languages",
	async () => {
		const exampleMessages: Message[] = [
			createMessage("a", {
				en: "test",
			}),
			createMessage("b", {
				en: "title",
				de: "Titel",
			}),
		]

		const repo = await mockRepo()
		const fs = repo.nodeishFs

		await fs.mkdir("/user/project.inlang", { recursive: true })
		await fs.writeFile(
			"/user/project.inlang/settings.json",
			JSON.stringify({
				sourceLanguageTag: "en",
				languageTags: ["en", "de", "it"],
				modules: ["./plugin.js"],
			} satisfies ProjectSettings)
		)

		const _mockPlugin: Plugin = {
			id: "plugin.inlang.json",
			description: { en: "Mock plugin description" },
			displayName: { en: "Mock Plugin" },
			loadMessages: () => exampleMessages,
			saveMessages: () => undefined as any,
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

		await translateCommandAction({ project })

		const messages = project.query.messages.getAll()

		expect(messages[0]?.variants.length).toBe(3)
		expect(messages[1]?.variants.length).toBe(3)

		for (const message of messages) {
			// @ts-ignore - type mismatch error - fix after refactor
			expect(message.variants.map((variant) => variant.languageTag).sort()).toStrictEqual([
				"de",
				"en",
				"it",
			])

			for (const variant of message.variants) {
				expect(variant.pattern[0]?.type).toBe("Text")

				if (variant.pattern[0]?.type === "Text") {
					expect(variant.pattern[0]?.value.length).toBeGreaterThan(2)
				}
			}
		}
	}
)

test.runIf(process.env.GOOGLE_TRANSLATE_API_KEY)(
	"it should escape variable references",
	async () => {
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
								value: "Good morning ",
							},
							{
								type: "VariableReference",
								name: "username",
							},
							{
								type: "Text",
								value: ".",
							},
						],
					},
				],
			},
		]

		const repo = await mockRepo()
		const fs = repo.nodeishFs

		await fs.mkdir("/user/project.inlang", { recursive: true })
		await fs.writeFile(
			"/user/project.inlang/settings.json",
			JSON.stringify({
				sourceLanguageTag: "en",
				languageTags: ["en", "de"],
				modules: ["./plugin.js"],
			} satisfies ProjectSettings)
		)

		const _mockPlugin: Plugin = {
			id: "plugin.inlang.json",
			description: { en: "Mock plugin description" },
			displayName: { en: "Mock Plugin" },
			loadMessages: () => exampleMessages,
			saveMessages: () => undefined as any,
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

		await translateCommandAction({ project })

		const messages = project.query.messages.getAll()

		expect(messages[0]?.variants.length).toBe(2)
		expect(messages[0]?.variants[1]?.languageTag).toBe("de")
		expect(
			messages[0]?.variants[1]?.pattern.some(
				(value) => value.type === "VariableReference" && value.name === "username"
			)
		).toBeTruthy()
	}
)
