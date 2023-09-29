import { it, expect } from "vitest"
import { calculateSummary } from "./calculateSummary.js"
import type { LanguageTag, MessageLintReport, Message, Pattern } from "@inlang/sdk"

it("should return 100% when no translation are missing", () => {
	const messages: Message[] = [createMessage("test", { en: "test", de: "test" })]
	const languageTags: LanguageTag[] = ["en", "de"]
	const reports: MessageLintReport[] = []
	const result = calculateSummary({
		reports,
		languageTags,
		messageIds: messages.map(({ id }) => id),
	})
	expect(result.percentage).toBe(100)
	expect(result.numberOfMissingVariants).toBe(0)
})

it("should return 50% when half of the messages are missing", () => {
	const messages: Message[] = [
		createMessage("message-1", { en: "test", de: "test" }),
		createMessage("message-2", { en: "test" }),
	]
	const languageTags: LanguageTag[] = ["en", "de"]
	const reports: MessageLintReport[] = [
		{
			messageId: "message-2",
			languageTag: "de",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
	]
	const result = calculateSummary({
		reports,
		languageTags,
		messageIds: messages.map(({ id }) => id),
	})
	expect(result.percentage).toBe(75)
	expect(result.numberOfMissingVariants).toBe(1)
})

it("should round the percentages", () => {
	const messages: Message[] = [
		createMessage("message-1", { en: "test", de: "test" }),
		createMessage("message-2", { en: "test" }),
		createMessage("message-3", { en: "test" }),
	]
	const languageTags: LanguageTag[] = ["en", "de"]
	const reports: MessageLintReport[] = [
		{
			messageId: "message-2",
			languageTag: "de",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
		{
			messageId: "message-3",
			languageTag: "de",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
	]
	const result = calculateSummary({
		reports,
		languageTags,
		messageIds: messages.map(({ id }) => id),
	})
	expect(result.percentage).toBe(67)
	expect(result.numberOfMissingVariants).toBe(2)
})

it("should work with multiple resources", () => {
	const messages: Message[] = [
		createMessage("message-1", { en: "test", de: "test" }),
		createMessage("message-2", { en: "test", fr: "test" }),
		createMessage("message-3", { en: "test" }),
	]
	const languageTags: LanguageTag[] = ["en", "de", "fr"]
	const reports: MessageLintReport[] = [
		{
			messageId: "message-1",
			languageTag: "fr",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
		{
			messageId: "message-2",
			languageTag: "de",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
		{
			messageId: "message-3",
			languageTag: "fr",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
		{
			messageId: "message-3",
			languageTag: "de",
			level: "warning",
			ruleId: "messageLintRule.inlang.missingTranslation",
			body: {
				en: "test",
			},
		},
	]
	const result = calculateSummary({
		reports,
		languageTags,
		messageIds: messages.map(({ id }) => id),
	})
	expect(result.percentage).toBe(56)
	expect(result.numberOfMissingVariants).toBe(4)
})

export const createMessage = (id: string, patterns: Record<string, Pattern | string>) =>
	({
		id,
		selectors: [],
		variants: Object.entries(patterns).map(([languageTag, patterns]) => ({
			languageTag,
			match: [],
			pattern:
				typeof patterns === "string"
					? [
							{
								type: "Text",
								value: patterns,
							},
					  ]
					: patterns,
		})),
	} satisfies Message)
