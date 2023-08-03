import { LintException, LintReport, LintRule, MessageLintReport } from "./api.js"
import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"
import { setupMessageLintRules } from "./setupMessageLintRules.js"

export const lintMessage = async (args: {
	config: InlangConfig
	rules: LintRule[]
	messages: Message[]
	query: MessageQueryApi
	message: Message
}): Promise<{ data: LintReport[]; errors: LintException[] }> => {
	const reports: MessageLintReport[] = []
	const exceptions: LintException[] = []

	const rules = await setupMessageLintRules({
		settings: args.config.settings?.lintRules,
		rules: args.rules,
	})

	const promises = rules.map(async (rule) => {
		const ruleId = rule.meta.id
		const level = rule.level
		try {
			await rule.message({
				message: args.message,
				query: args.query,
				config: args.config,
				options: {},
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
			exceptions.push(new LintException(`Exception in lint rule '${ruleId}'.`, { cause: error }))
		}
	})

	await Promise.all(promises)

	return { data: reports, errors: exceptions }
}
