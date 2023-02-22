import type { ConfiguredLintRule, LintConfigSettings, LintRule } from './rule.js';

/**
 * A collection of lint rules.
 */
export type RuleCollection = <RulesSettings extends Record<string, LintRule>>(settings?: CollectionSettings<RulesSettings>) => ConfiguredLintRule[];

type CollectionSettings<RulesSettings extends Record<string, LintRule>> = {
	[Key in keyof RulesSettings]?: Parameters<RulesSettings[Key]>[0] | Parameters<RulesSettings[Key]>
}

/**
 *
 * @param rules
 * @returns
 */
export const createRuleCollection = <RulesSettings extends Record<string, LintRule>>(rules: RulesSettings): RuleCollection =>
	(settings = {}) =>
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
