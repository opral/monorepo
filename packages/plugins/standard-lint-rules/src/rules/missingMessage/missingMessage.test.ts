import { expect, test } from "vitest"
import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"
import { missingMessageRule } from "./missingMessage.js"
import { lintSingleMessage } from "@inlang/lint"

const message1: Message = {
	id: "1",
	selectors: [],
	body: {
		en: [{ match: {}, pattern: [{ type: "Text", value: "Inlang" }] }],
		de: [{ match: {}, pattern: [{ type: "Text", value: "Inlang" }] }],
		fr: [],
		es: [{ match: {}, pattern: [] }],
		cn: [{ match: {}, pattern: [{ type: "Text", value: "" }] }],
	},
}

const messages = [message1]

test("should not report if all messages are present", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		lintLevels: {
			[missingMessageRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [missingMessageRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})

test("should report if a languageTag is not present", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "it"],
		lintLevels: {
			[missingMessageRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [missingMessageRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("it")
})

test("should report if no variants are defined", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "fr"],
		lintLevels: {
			[missingMessageRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [missingMessageRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("fr")
})

test("should report if no patterns are defined", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "es"],
		lintLevels: {
			[missingMessageRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [missingMessageRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("es")
})

test("should report if a message has a pattern with only one text element that is an empty string", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "cn"],
		lintLevels: {
			[missingMessageRule.meta.id]: "warning",
		},
		lintRuleSettings: {},
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [missingMessageRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("cn")
})
