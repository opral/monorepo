import { describe, it, expect } from "vitest"
import { translateCommandAction } from "./translate.js"
import { openInlangProject } from "@inlang/app"
import { createMockNodeishFs } from "@inlang/plugin/test"
import { privateEnv } from "@inlang/env-variables"
import type { InlangConfig } from "@inlang/config"
import type { InlangModule } from "@inlang/module"
import type { Plugin } from "@inlang/plugin"
import type { Message } from "@inlang/messages"

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

describe("translate command", () => {
	it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
		"should tanslate the missing languages",
		async () => {
			const fs = await createMockNodeishFs()

			await fs.writeFile(
				"./inlang.config.json",
				JSON.stringify({
					sourceLanguageTag: "en",
					languageTags: ["en", "de", "it"],
					modules: [""],
					settings: {
						"project.lintRuleLevels": {},
					},
				} satisfies InlangConfig),
			)

			const _mockPlugin: Plugin = {
				meta: {
					id: "inlang.plugin.json",
					description: { en: "Mock plugin description" },
					displayName: { en: "Mock Plugin" },
				},
				loadMessages: () => exampleMessages,
				saveMessages: () => undefined as any,
			}

			const _import = async () => {
				return {
					default: {
						plugins: [_mockPlugin],
					},
				} satisfies InlangModule
			}

			const inlang = await openInlangProject({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import,
			})

			await translateCommandAction({ inlang })

			const messages = inlang.query.messages.getAll()

			expect(messages[0]?.variants.length).toBe(3)
			expect(messages[1]?.variants.length).toBe(3)

			for (const message of messages) {
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
		},
	)
})
