import { describe, it, expect } from "vitest"
import { translateCommandAction } from "./translate.js"
import { Message, ProjectSettings, loadProject, Plugin, type InlangModule } from "@inlang/sdk"
import { privateEnv } from "@inlang/env-variables"
import { createNodeishMemoryFs } from "@lix-js/fs"

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

describe("translate command", () => {
	it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
		"should tanslate the missing languages",
		async () => {
			const fs = createNodeishMemoryFs()

			await fs.mkdir("/user/project/", { recursive: true })
			await fs.writeFile(
				"/user/project/project.inlang.json",
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
				projectPath: "/user/project/project.inlang.json",
				nodeishFs: fs,
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
})
