import type { Message } from "@inlang/messages"
import { lintSingleMessage } from "./lintSingleMessage.js"
import type { LintRuleThrowedError } from "./errors.js"
import type { LanguageTag } from "@inlang/language-tag"
import type { LintLevel, LintReport, LintRule } from "./api.js"
import type { JSONSerializableObject } from "@inlang/json-serializable"

export const lintMessages = async (args: {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	lintRuleSettings: Record<LintRule["meta"]["id"], JSONSerializableObject>
	lintLevels: Record<LintRule["meta"]["id"], LintLevel>
	rules: LintRule[]
	messages: Message[]
}): Promise<{ data: LintReport[]; errors: LintRuleThrowedError[] }> => {
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
