import type { MessageLintRule, MessageLintReport } from "@inlang/message-lint-rule"
import type { Message } from "@inlang/message"
import type { ProjectSettings } from "@inlang/project-settings"
import { MessagedLintRuleThrowedError } from "./errors.js"

/**
 * Lint a single message.
 *
 * - the lint rule levels defaults to `warning`.
 */
export const lintSingleMessage = async (args: {
	settings: ProjectSettings & Required<Pick<ProjectSettings, "messageLintRuleLevels">>
	rules: MessageLintRule[]
	messages: Message[]
	message: Message
}): Promise<{ data: MessageLintReport[]; errors: MessagedLintRuleThrowedError[] }> => {
	const reports: MessageLintReport[] = []
	const errors: MessagedLintRuleThrowedError[] = []

	const rulesWithLevels = args.rules.map((rule) => {
		const level = args.settings.messageLintRuleLevels?.[rule.id]
		if (level === undefined) throw Error("No lint level provided for lint rule: " + rule.id)
		return { ...rule, level }
	})

	const promises = rulesWithLevels.map(async (rule) => {
		try {
			await rule.run({
				message: args.message,
				settings: args.settings,
				report: (reportArgs) => {
					reports.push({
						ruleId: rule.id,
						level: rule.level,
						messageId: reportArgs.messageId,
						languageTag: reportArgs.languageTag,
						body: reportArgs.body,
					})
				},
			})
		} catch (error) {
			errors.push(
				new MessagedLintRuleThrowedError(
					`Lint rule '${rule.id}' throwed while linting message "${args.message.id}".`,
					{ cause: error }
				)
			)
		}
	})

	await Promise.all(promises) // wait for all lints to finish
	const sortedReports = reports.sort((r1, r2) => r1.ruleId.localeCompare("en", r2.ruleId))
	return { data: sortedReports, errors }
}
