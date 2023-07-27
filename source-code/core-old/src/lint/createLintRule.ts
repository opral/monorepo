import type { LintRule } from "./rule.js"

/**
 * A utility function to create a lint rule.
 *
 * @example
 * const myRule = createLintRule({ id: "example.rule" }, (args) => {
 *   // Implement your rule logic here
 * });
 *
 * // using the rule
 * myRule("error");
 *
 * // you can also pass settings to the rule
 * const myRule2 = createLintRule<{ strict: boolean }>({ id: "example.rule" }, (args) => {
 *   // Implement your rule logic here
 * });
 *
 * // settings must be provided when using the rule
 * myRule2("error", { strict: true });
 */
export const createLintRule = <
	RuleSettings extends Record<string, unknown> | undefined = undefined,
>(
	callback: (settings: RuleSettings) => Omit<LintRule, "level">,
): ConfigureLintRuleFunction<RuleSettings> => {
	// @ts-expect-error
	// The config being dynamically added to the args does not play nicely with TypeScript.
	// Given that the settings are optional and this is an implementation issue, we can ignore
	// this error and avoid more complex types.
	const configureLintRule: ConfigureLintRuleFunction<RuleSettings> = (level, settings) => {
		// @ts-expect-error
		const rule = callback(settings)

		return {
			...rule,
			// overwrite the level with the one provided by the user
			level,
		} satisfies LintRule
	}

	return configureLintRule
}

/**
 * Type for the function that configures a lint rule.
 */
type ConfigureLintRuleFunction<
	RuleSettings extends Record<string, unknown> | undefined = undefined,
> = RuleSettings extends undefined
	? // If settings are not defined, the function only takes a level
	  (level: LintRule["level"]) => LintRule
	: // Else, the function takes a level and config
	  (level: LintRule["level"], settings: RuleSettings) => LintRule
