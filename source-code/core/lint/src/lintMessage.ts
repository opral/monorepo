import type { SuccessWithErrorResult } from '@inlang/result'
import { LintException, LintReport, MessageLintRule, MessageLintReport } from './api.js'
import type { InlangConfig } from '@inlang/config'
import type { Message, MessageQueryApi } from '@inlang/messages'

export const lintMessage = async (args: {
	config: InlangConfig,
	messages: Message[],
	query: MessageQueryApi,
	message: Message
}): Promise<SuccessWithErrorResult<LintReport[], LintException[]>> => {
	const reports: LintReport[] = []
	const exceptions: LintException[] = []

	const rules = [] as MessageLintRule[] // TODO: how to get the lint rules?
	const promises = rules.map(async rule => {
		const ruleId = rule.meta.id
		const level = rule.meta.defaultLevel // TODO: set correct level
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
						} satisfies MessageLintReport as unknown as LintReport) // TODO: WTF?
				}),
			})
		} catch (error) {
			exceptions.push(new LintException(`Exception in lint rule '${ruleId}'.`, { cause: error }))
		}
	})

	await Promise.all(promises)

	return { data: reports, error: exceptions }
}
