import type { LintRule } from "@inlang/lint"
import type { Plugin } from "@inlang/plugin"

/* Avoids circular dependency */
type PluginInModule = Plugin
type LintRuleInModule = LintRule

/**
 * The inlang module API.
 *
 * An inlang module exports a default object with the following properties:
 *
 * - `plugins`: An array of plugins.
 * - `lintRules`: An array of lint rules.
 *
 * @example
 *   export default {
 *     plugins: [plugin1, plugin2],
 *     lintRules: [lintRule1, lintRule2],
 *   }
 */

export type InlangModule = {
	default: {
		plugins: PluginInModule[]
		lintRules: LintRuleInModule[]
	}
}
