import type { LintRuleSettings } from "@inlang/config"
import type { LintRule, MessageLintRule } from "./api.js"

export const setupMessageLintRules = async (args: {
	settings: Record<`${string}.${string}`, LintRuleSettings> | undefined
	rules: LintRule[]
}) => {
	const rulesToSetup = args.rules.filter(isMessageLintRule)

	const promises = rulesToSetup.map(async (rule) => {
		const { level } = args.settings?.[rule.meta.id] || {}
		if (level === "off") {
			return undefined
		}

		return {
			...rule,
			level: level || rule.defaultLevel,
		}
	})

	const rules = (await Promise.all(promises)).filter(Boolean)
	return rules as NonNullable<(typeof rules)[number]>[]
}

// @ts-ignore
const isMessageLintRule = <Rule extends LintRule>(rule: Rule): rule is MessageLintRule =>
	!!(rule as any)["message"]
