import { LintException, LintReport, MessageLintReport, LintRule, MessageLintRule } from './api.js'
import type { InlangConfig } from '@inlang/config'
import type { Message, MessageQueryApi } from '@inlang/messages'

export const lintMessage = async (args: {
	config: InlangConfig,
	messages: Message[],
	query: MessageQueryApi,
	message: Message
}): Promise<{ data: LintReport[], errors: LintException[] }> => {
	const reports: MessageLintReport[] = []
	const exceptions: LintException[] = []

	const rules = await setupMessageLintRules()
	const promises = rules.map(async rule => {
		const ruleId = rule.meta.id
		const level = rule.defaultLevel
		try {
			await rule.message({
				message: args.message,
				query: args.query,
				config: args.config,
				report: (reportArgs => {
					reports
						.push({
							type: "MessageLint",
							ruleId,
							level,
							...reportArgs,
						})
				}),
			})
		} catch (error) {
			exceptions.push(new LintException(`Exception in lint rule '${ruleId}'.`, { cause: error }))
		}
	})

	await Promise.all(promises)

	return { data: reports, errors: exceptions }
}

const setupMessageLintRules = async (): Promise<MessageLintRule[]> => {
	// // lint rules
	// resolvedPluginApi.data.resolvedLintRules
	// // settings
	// config.settings?.lintRules['rule1']?.options
	// // level
	// config.settings?.lintRules['rule1']?.level

	const rules = ([] as LintRule[]).filter(isMessageLintRule) // TODO: how to get the lint rules?

	return []
}

// @ts-ignore // TODO
function isMessageLintRule<Rule extends LintRule>(rule: Rule): rule is MessageLintRule {
	return !!(rule as any)['message']
}
