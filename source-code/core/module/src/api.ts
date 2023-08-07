import type { InlangConfig } from "@inlang/config"
import type { LintRule, ResolvedLintRule } from "@inlang/lint"
import type { Plugin, ResolvePluginsFunction } from "@inlang/plugin"
import type { ModuleError, ModuleImportError } from "./errors.js"
import type { ImportFunction } from "./import.js"

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
		plugins?: Plugin<any>[]
		lintRules?: LintRule[]
	}
}

/**
 * Function that resolves modules from the config.
 */
export type ResolvedModulesFunction = (args: {
	config: InlangConfig
	$import: ImportFunction
}) => Promise<{
	data: {
		plugins: Awaited<ReturnType<ResolvePluginsFunction>>
		lintRules: ResolvedLintRule[]
	}
	errors: Array<ModuleError | ModuleImportError>
}>
