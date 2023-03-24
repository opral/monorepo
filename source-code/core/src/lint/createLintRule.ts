import type { LintRule } from "./rule.js"

/**
 * A utility function to create a lint rule.
 *
 * @example
 * const myRule = createLintRule({ id: "example.rule" }, async (args) => {
 *   // Implement your rule logic here
 * });
 */
export const createLintRule: CreateLintRuleFunction = (args, setup) => {
	const { id } = args

	const configureLintRule: ConfigureLintRuleFunction = (level, settings) => {
		return {
			id,
			level,
			setup: (args) => setup({ ...args, settings }),
		}
	}

	return configureLintRule
}

/**
 * Type for the function that creates a lint rule.
 * @example
 * const createLintRule: CreateLintRuleFunction = (args, fn) => {
 *   // Implement the lint rule creation logic
 * };
 */
type CreateLintRuleFunction = (
	args: { id: LintRule["id"] },
	setup: (
		args: Parameters<LintRule["setup"]>[0] & {
			settings: any
		},
	) => ReturnType<LintRule["setup"]>,
) => ConfigureLintRuleFunction

/**
 * Type for the function that configures a lint rule.
 *
 * @example
 * const configureLintRule: ConfigureLintRuleFunction = (level, settings) => {
 *   // Implement the lint rule configuration logic
 * };
 */
type ConfigureLintRuleFunction = (level: LintRule["level"], settings?: any) => LintRule
