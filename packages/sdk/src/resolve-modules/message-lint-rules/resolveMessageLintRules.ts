import { Value } from "@sinclair/typebox/value"
import { MessageLintRule } from "@inlang/message-lint-rule"
import { MessageLintRuleIsInvalidError } from "./errors.js"

export const resolveMessageLintRules = (args: { messageLintRules: Array<MessageLintRule> }) => {
	const result = {
		data: [] as Array<MessageLintRule>,
		errors: [] as MessageLintRuleIsInvalidError[],
	}
	for (const rule of args.messageLintRules) {
		if (Value.Check(MessageLintRule, rule) === false) {
			result.errors.push(
				new MessageLintRuleIsInvalidError(`Couldn't parse lint rule "${rule.id}"`, {
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
