import { LintRule } from "@inlang/lint"
import { Value } from "@sinclair/typebox/value"

export class LintRuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.module = options.module
		this.name = "LintRuleError"
	}
}

export const resolveLintRules = (args: {
	lintRules: Array<LintRule & { meta: { module?: string } }>
}) => {
	const result = {
		data: [] as Array<LintRule>,
		errors: [] as LintRuleError[],
	}
	for (const rule of args.lintRules) {
		if (Value.Check(LintRule, rule) === false) {
			result.errors.push(
				new LintRuleError(
					`Couldn't parse lint rule "${rule.meta.id}"${
						!rule.meta.module ? "" : ` from module  ${rule.meta.module}`
					}"`,
					{
						module: "not implemented",
					},
				),
			)
			continue
		} else {
			result.data.push(rule)
		}
	}

	return result
}
