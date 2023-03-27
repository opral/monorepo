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
	Settings extends Record<string, unknown> | undefined = undefined,
>(args: {
	id: LintRule["id"]
	setup: (
		args: Parameters<LintRule["setup"]>[0] & {
			settings: Settings
		},
	) => ReturnType<LintRule["setup"]>
}): ConfigureLintRuleFunction<Settings> => {
	const { id } = args

	// @ts-expect-error
	// The settings being dynamically added to the args does not play nicely with TypeScript.
	// Given that the settings are optional and this is an implementation issue, we can ignore
	// this error and avoid more complex types.
	const configureLintRule: ConfigureLintRuleFunction<Settings> = (level, settings) => {
		return {
			id,
			level,
			// @ts-expect-error
			setup: (_args) => args.setup({ ..._args, settings }),
		}
	}

	return configureLintRule
}

/**
 * Type for the function that configures a lint rule.
 */
type ConfigureLintRuleFunction<Settings extends Record<string, unknown> | undefined = undefined> =
	Settings extends undefined
		? // If settings are not defined, the function only takes a level
		  (level: LintRule["level"]) => LintRule
		: // Else, the function takes a level and settings
		  (level: LintRule["level"], settings: Settings) => LintRule
