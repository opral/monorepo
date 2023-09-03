import type {
	MessageLintLevel,
	MessageLintRule,
	MessageLintReport,
} from "@inlang/message-lint-rule"
import type { Message } from "@inlang/message"
import { MessagedLintRuleThrowedError } from "./errors.js"
import type { LanguageTag } from "@inlang/language-tag"
import type { JSONObject } from "@inlang/json-types"

/**
 * Lint a single message.
 *
 * - the lint rule levels defaults to `warning`.
 */
export const lintSingleMessage = async (args: {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	ruleSettings: Record<MessageLintRule["meta"]["id"], JSONObject>
	ruleLevels: Record<MessageLintRule["meta"]["id"], MessageLintLevel>
	rules: MessageLintRule[]
	messages: Message[]
	message: Message
}): Promise<{ data: MessageLintReport[]; errors: MessagedLintRuleThrowedError[] }> => {
	const reports: MessageLintReport[] = []
	const errors: MessagedLintRuleThrowedError[] = []

	const promises = args.rules.map(async (rule) => {
		const ruleId = rule.meta.id
		const settings = args.ruleSettings?.[ruleId] ?? {}
		const level = args.ruleLevels?.[ruleId]

		if (level === undefined) {
			throw Error("No lint level provided for lint rule: " + ruleId)
		}

		try {
			await rule.message({
				...args,
				settings,
				report: (reportArgs) => {
					reports.push({
						ruleId,
						level,
						...reportArgs,
					})
				},
			})
		} catch (error) {
			errors.push(
				new MessagedLintRuleThrowedError(
					`Lint rule '${ruleId}' throwed while linting message "${args.message.id}".`,
					{ cause: error },
				),
			)
		}
	})

	await Promise.all(promises)

	return { data: reports, errors }
}
