import { expect, test } from "vitest"
import type { InlangConfig } from "@inlang/config"
import { lintSingleMessage } from '@inlang/lint'
import type { Message, MessageQueryApi } from '@inlang/messages'
import { messageWithoutSourceRule } from './messageWithoutSource.js'

const message1: Message = {
	id: "1",
	selectors: [],
	body: {
		en: [],
		de: [],
	},
}

const messages = [message1]

test("should not report if source message present", async () => {
	const result = await lintSingleMessage({
		config: {
			sourceLanguageTag: "en",
		} as Partial<InlangConfig> as InlangConfig,
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [messageWithoutSourceRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})

test("should report if source message is missing", async () => {
	const result = await lintSingleMessage({
		config: {
			sourceLanguageTag: "it",
		} as Partial<InlangConfig> as InlangConfig,
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [messageWithoutSourceRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("it")
})
