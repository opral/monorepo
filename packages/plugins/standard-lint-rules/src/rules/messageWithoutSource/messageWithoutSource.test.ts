/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
import { lintSingleMessage } from "@inlang/sdk/lint"
import type { Message } from "@inlang/message"
import { messageWithoutSourceRule } from "./messageWithoutSource.js"

const message1: Message = {
	id: "1",
	selectors: [],
	variants: [
		{ languageTag: "en", match: {}, pattern: [] },
		{ languageTag: "de", match: {}, pattern: [] },
	],
}

const messages = [message1]

test("should not report if source message present", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en"],
		lintLevels: {
			[messageWithoutSourceRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		messages,
		message: message1,
		lintRules: [messageWithoutSourceRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})

test("should report if source message is missing", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "it",
		languageTags: ["it"],
		lintLevels: {
			[messageWithoutSourceRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		messages,
		message: message1,
		lintRules: [messageWithoutSourceRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("it")
})
