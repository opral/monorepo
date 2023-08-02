import type { LintRuleSettings } from '@inlang/config'
import type { LintRule, MessageLintRule } from './api.js'

const alreadySetupRules: LintRule['meta']['id'][] = []

export const setupMessageLintRules = async (args: {
	settings: Record<`${string}.${string}`, LintRuleSettings> | undefined,
	rules: LintRule[]
}) => {
	const rulesToSetup = (args.rules).filter(isMessageLintRule)

	const promises = rulesToSetup.map(async rule => {
		const { level, options } = args.settings?.[rule.meta.id] || {}
		if (level === 'off') {
			return undefined
		}

		if (!alreadySetupRules.includes(rule.meta.id) && rule.setup) {
			await rule.setup({ options })
			// alreadySetupRules.push(rule.meta.id)
		}

		return {
			...rule,
			level: level || rule.defaultLevel,
		}
	})

	const rules = (await Promise.all(promises)).filter(Boolean)
	return rules as NonNullable<typeof rules[number]>[]
}

// @ts-ignore
const isMessageLintRule = <Rule extends LintRule>(rule: Rule): rule is MessageLintRule =>
	!!(rule as any)['message']
