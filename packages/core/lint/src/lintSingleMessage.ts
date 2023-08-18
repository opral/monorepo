import type { LintLevel, LintRule, MessageLintReport } from "./api.js"
import type { Message, MessageQueryApi } from "@inlang/messages"
import { LintRuleThrowedError } from "./errors.js"
import type { LanguageTag } from "@inlang/language-tag"
import type { JSONSerializableObject } from "@inlang/json-serializable"

/**
 * Lint a single message.
 *
 * - the lint rule levels defaults to `warning`.
 */
export const lintSingleMessage = async (args: {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	lintRuleSettings: Record<LintRule["meta"]["id"], JSONSerializableObject>
	lintLevels: Record<LintRule["meta"]["id"], LintLevel>
	rules: LintRule[]
	messages: Message[]
	query: MessageQueryApi
	message: Message
}): Promise<{ data: MessageLintReport[]; errors: LintRuleThrowedError[] }> => {
	const reports: MessageLintReport[] = []
	const errors: LintRuleThrowedError[] = []

	const promises = args.rules
		.filter((rule) => rule.type === "MessageLint")
		.map(async (rule) => {
			const ruleId = rule.meta.id
			const settings = args.lintRuleSettings?.[ruleId] ?? {}
			const level = args.lintLevels?.[ruleId]

			if (level === undefined) {
				throw Error("No lint level provided for lint rule: " + ruleId)
			}

			try {
				await rule.message({
					...args,
					settings,
					report: (reportArgs) => {
						reports.push({
							type: "MessageLint",
							ruleId,
							level,
							...reportArgs,
						})
					},
				})
			} catch (error) {
				errors.push(
					new LintRuleThrowedError(
						`Lint rule '${ruleId}' throwed while linting message "${args.message.id}".`,
						{ cause: error },
					),
				)
			}
		})

	await Promise.all(promises)

	return { data: reports, errors }
}
