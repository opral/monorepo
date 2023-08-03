import { expect, test } from "vitest"
import { lintMessage } from "@inlang/lint"
import type { Message, MessageQueryApi } from '@inlang/messages'
import { identicalPatternRule } from './identicalPattern.js'
import type { InlangConfig } from '@inlang/config'

const message1: Message = {
	id: "1",
	expressions: [],
	selectors: [],
	body: {
		en: [{ match: {}, pattern: [{ type: 'Text', value: 'This is Inlang' }] }],
		de: [{ match: {}, pattern: [{ type: 'Text', value: 'Das ist Inlang' }] }],
		fr: [{ match: {}, pattern: [{ type: 'Text', value: 'This is Inlang' }] }],
	},
}

const messages = [message1]

test("should report if identical message found in another language", async () => {
	const result = await lintMessage({
		config: {
			sourceLanguageTag: "en",
		} as Partial<InlangConfig> as InlangConfig,
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [identicalPatternRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("fr")
})

test("should not report if pattern is present in 'ignore'", async () => {
	const result = await lintMessage({
		config: {
			sourceLanguageTag: "en",
			settings: { lintRules: { "inlang.identicalPattern": { options: { ignore: ['This is Inlang'] } } } }
		} as Partial<InlangConfig> as InlangConfig,
		query: {} as MessageQueryApi,
		messages,
		message: message1,
		rules: [identicalPatternRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})
