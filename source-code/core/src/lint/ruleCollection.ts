import type { LintRule, LintConfigOptions, LintRuleInitializer } from './rule.js';

/**
 * An utility type to add strong type definitions for a lint rule collection.
 */
export type RuleCollectionInitializer<RulesSettings extends Record<string, LintRuleInitializer>> = (settings?: CollectionSettings<RulesSettings>) => LintRule[];

type CollectionSettings<RulesSettings extends Record<string, LintRuleInitializer>> = {
	[Key in keyof RulesSettings]?: Parameters<RulesSettings[Key]>[0] | Parameters<RulesSettings[Key]>
}

/**
 * An utility function that adds strong type definitions for a collection of lint rules.
 *
 * @param rules the rules for this collection
 * @returns an initializer function to configure all lint rules in the collection
 *
 * @example
 * ```
 * const myRuleCollection = createLintRuleCollection({
 * 	'missingKey': missingKeyRule,
 * 	'invalidKey': invalidKeyRule,
 * })
 * ```
 */
export const createLintRuleCollection = <RulesSettings extends Record<string, LintRuleInitializer>>(rules: RulesSettings): RuleCollectionInitializer<RulesSettings> =>
	(settings = {}) =>
		Object.entries(rules)
			.map(([id, rule]) => {
				const settingsForRule = settings[id]

				return rule(
					...(Array.isArray(settingsForRule)
						? settingsForRule
						: [settingsForRule]
					) as LintConfigOptions<never>
				)
			})
