import type { Message } from "@inlang/message"
import { lintSingleMessage } from "./lintSingleMessage.js"
import type { MessagedLintRuleThrowedError } from "./errors.js"
import type { LanguageTag } from "@inlang/language-tag"
import type { JSONObject } from "@inlang/json-types"
import type {
	MessageLintLevel,
	MessageLintReport,
	MessageLintRule,
} from "@inlang/message-lint-rule"

export const lintMessages = async (args: {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	ruleSettings: Record<MessageLintRule["meta"]["id"], JSONObject>
	ruleLevels: Record<MessageLintRule["meta"]["id"], MessageLintLevel>
	rules: MessageLintRule[]
	messages: Message[]
}): Promise<{ data: MessageLintReport[]; errors: MessagedLintRuleThrowedError[] }> => {
	const promises = args.messages.map((message) =>
		lintSingleMessage({
			...args,
			message,
		}),
	)

	const results = await Promise.all(promises)

	return {
		data: results.flatMap((result) => result.data).filter(Boolean),
		errors: results.flatMap((result) => result.errors).filter(Boolean),
	}
}
