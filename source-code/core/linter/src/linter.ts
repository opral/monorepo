import { InlangEnvironment, InlangInstance, LintReport, Message, MessageLintReport, MessageLintRule, createInlang } from '@inlang/app'

export const createLinter = async (args: {
	configPath: string
	env: InlangEnvironment
}) => {
	const inlang = await createInlang(args)

	return {
		lintMessage: (message: Message) => lintMessage({ inlang, message }),
	}
}

const lintMessage = async (args: {
	inlang: InlangInstance
	message: Message
}): Promise<void> => {
	// TODO: how to get the lint rules?
	for (const rule of [] as MessageLintRule[]) { // TODO: parallelize
		try {
			await rule.message({
				message: args.message,
				query: args.inlang.query.messages,
				config: args.inlang.config.get(),
				report: (reportArgs => {
					// TODO: how to get rid of the old entry?
					args.inlang.lint.reports()
						.push({
							type: "MessageLint",
							ruleId: rule.meta.id,
							level: rule.meta.defaultLevel, // TODO: set correct level
							...reportArgs,
						} satisfies MessageLintReport as unknown as LintReport) // TODO: WTF?
				}),
			})
		} catch (e) {
			// TODO: how to get rid of the old entry?
			args.inlang.lint.exceptions()
				.push(
					new ExceptionDuringLinting(`Exception in lint rule '${rule.meta.id}'`, {
						cause: e,
					}),
				)
		}
	}
}

// TODO: use new syntax
class ExceptionDuringLinting extends Error {
	readonly #id = "ExceptionDuringLinting"
}
