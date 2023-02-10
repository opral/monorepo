import type { LintConfigSettings, LintRule } from './rule.js';

type CollectionSettings<RulesSettings extends Record<string, LintRule>> = {
	[Key in keyof RulesSettings]?: Parameters<RulesSettings[Key]>[0] | Parameters<RulesSettings[Key]>
}

export const createRuleCollection = <RulesSettings extends Record<string, LintRule>>(rules: RulesSettings) =>
	(settings: CollectionSettings<RulesSettings> = {}) =>
		Object.entries(rules)
			.map(([id, rule]) => {
				const settingsForRule = settings[id]

				return rule(
					...(Array.isArray(settingsForRule)
						? settingsForRule
						: [settingsForRule]
					) as LintConfigSettings<never>
				)
			})
