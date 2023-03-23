import { createReportFunction } from "./report.js"
import type { CreateLintRuleFunction, LintRuleSetupFunction } from "./types.js"

/**
 * Creates a lint rule based on the provided configuration and function.
 *
 * @example
 * const myRule = createLintRule({ id: "example.rule" }, async (args) => {
 *   // Implement your rule logic here
 * });
 */
export const createLintRule: CreateLintRuleFunction = (args, fn) => {
	const { id } = args

	return (level, settings) => {
		const report = createReportFunction({ id, level })

		/**
		 * Sets up the lint rule and returns the configured lint rule object.
		 *
		 * @param {Object} args - The configuration arguments.
		 * @returns {Promise<Object>} A Promise that resolves to the configured lint rule object.
		 *
		 * @example
		 * const setup = myRule("error", { strict: true });
		 * const rule = await setup({ config: { referenceLanguage: "en", languages: ["en", "de"] } });
		 */
		const setup: LintRuleSetupFunction = async (args) => {
			const { visitors } = await fn({ report, settings, ...args })

			return {
				id,
				level,
				visitors,
			}
		}

		return setup
	}
}
