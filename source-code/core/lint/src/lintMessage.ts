import { LintError, LintRule, MessageLintReport, MessageLintRule } from "./api.js"
import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"

export const lintMessage = async (args: {
	config: InlangConfig
	rules: LintRule[]
	messages: Message[]
	query: MessageQueryApi
	message: Message
}): Promise<{ data: MessageLintReport[]; errors: LintError[] }> => {
	const reports: MessageLintReport[] = []
	const errors: LintError[] = []

	const promises = args.rules.filter(isMessageLintRule)
		.map(async (rule) => {
			const ruleId = rule.meta.id
			const { level = rule.defaultLevel, options = {} } = args.config.settings?.lintRules?.[ruleId] || {}

			if (level === "off") {
				return
			}

			try {
				await rule.message({
					message: args.message,
					query: args.query,
					config: args.config,
					options,
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
				errors.push(new LintError(`Error in lint rule '${ruleId}'.`, { cause: error }))
			}
		})

	await Promise.all(promises)

	return { data: reports, errors }
}

// @ts-ignore
const isMessageLintRule = <Rule extends LintRule>(rule: Rule): rule is MessageLintRule =>
	!!(rule as any)["message"]
