import type { Message } from "@inlang/message"
import { lintSingleMessage } from "./lintSingleMessage.js"
import type { MessagedLintRuleThrowedError } from "./errors.js"
import type { LanguageTag } from "@inlang/language-tag"
import type { LintLevel, LintReport, LintRule } from "@inlang/lint-rule"
import type { JSONObject } from "@inlang/json-types"

export const lintMessages = async (args: {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	lintRuleSettings: Record<LintRule["meta"]["id"], JSONObject>
	lintLevels: Record<LintRule["meta"]["id"], LintLevel>
	lintRules: LintRule[]
	messages: Message[]
}): Promise<{ data: LintReport[]; errors: MessagedLintRuleThrowedError[] }> => {
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
