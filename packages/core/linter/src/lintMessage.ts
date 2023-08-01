import type { InlangInstance, Message, LintReport, MessageLintRule, MessageLintReport, SuccessWithErrorResult } from '@inlang/app'

export const lintMessage = async (args: {
	inlang: InlangInstance
	message: Message
}): Promise<SuccessWithErrorResult<LintReport[], LintException[]>> => {
	const reports: LintReport[] = []
	const exceptions: LintException[] = []

	const config = args.inlang.config.get()
	const query = args.inlang.query.messages

	const rules = [] as MessageLintRule[] // TODO: how to get the lint rules?
	const promises = rules.map(async rule => {
		const ruleId = rule.meta.id
		const level = rule.meta.defaultLevel // TODO: set correct level
		try {
			await rule.message({
				message: args.message,
				query,
				config,
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
			exceptions.push(new LintException(ruleId, error))
		}
	})

	await Promise.allSettled(promises)

	return { data: reports, error: exceptions }
}

export class LintException extends Error {
	readonly #id = "LintException"

	constructor(lintRuleId: string, cause: unknown) {
		super(
			`Exception in lint rule '${lintRuleId}'.`,
			{ cause },
		)
	}
}
