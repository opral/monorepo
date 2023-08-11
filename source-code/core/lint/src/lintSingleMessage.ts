import type { LintRule, MessageLintReport } from "./api.js"
import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"
import { LintRuleThrowedError } from "./errors.js"

export const lintSingleMessage = async (args: {
	config: InlangConfig
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
			const settings = args.config?.settings?.[ruleId] ?? {}
			const level = args.config.settings?.["system.lintRuleLevels"]?.[ruleId] ?? rule.defaultLevel

			if (level === "off") {
				return
			}

			try {
				await rule.message({
					message: args.message,
					query: args.query,
					sourceLanguageTag: args.config.sourceLanguageTag,
					languageTags: args.config.languageTags,
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
