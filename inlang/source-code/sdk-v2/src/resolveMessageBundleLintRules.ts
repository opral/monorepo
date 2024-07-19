import { Value } from "@sinclair/typebox/value"
import { MessageBundleLintRule } from "./types/lint.js"
import { MessageBundleLintRuleIsInvalidError } from "./types/lint-errors.js"

export const resolveMessageBundleLintRules = (args: {
	messageLintRules: Array<MessageBundleLintRule>
}) => {
	const result = {
		data: [] as Array<MessageBundleLintRule>,
		errors: [] as MessageBundleLintRuleIsInvalidError[],
	}
	for (const rule of args.messageLintRules) {
		if (Value.Check(MessageBundleLintRule, rule) === false) {
			const errors = [...Value.Errors(MessageBundleLintRule, rule)]
			result.errors.push(
				new MessageBundleLintRuleIsInvalidError({
					// @ts-ignore
					id: rule.id,
					errors,
				})
			)
			continue
		} else {
			result.data.push(rule)
		}
	}

	return result
}
