import { Value } from "@sinclair/typebox/value"
import { LintRule } from "@inlang/lint-rule"
import { MessageLintRuleIsInvalidError } from "./errors.js"

export const resolveMessageLintRules = (args: { lintRules: Array<LintRule> }) => {
	const result = {
		data: [] as Array<LintRule>,
		errors: [] as MessageLintRuleIsInvalidError[],
	}
	for (const rule of args.lintRules) {
		// @ts-ignore - type mismatch error
		if (Value.Check(LintRule, rule) === false) {
			result.errors.push(
				new MessageLintRuleIsInvalidError(`Couldn't parse lint rule "${rule.meta.id}"`, {
					module: "not implemented",
				}),
			)
			continue
		} else {
			result.data.push(rule)
		}
	}

	return result
}
