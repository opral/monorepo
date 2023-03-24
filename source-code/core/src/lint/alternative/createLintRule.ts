import type { CreateLintRuleFunction, ConfigureLintRuleFunction } from "./types.js"

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
