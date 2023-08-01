import type { InlangConfig, LintRuleSettings } from "@inlang/config"
import type { LintRule } from "@inlang/lint"
import type { Plugin, ResolvePluginsFunction } from "@inlang/plugin"
import type { ModuleError, ModuleImportError } from "./errors.js"
import type { InlangEnvironment } from "@inlang/environment"

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
		plugins?: Plugin[]
		lintRules?: LintRule[]
	}
}

/**
 * Function that resolves modules from the config.
 */
export type ResolvedModulesFunction = (args: {
	config: InlangConfig
	env: InlangEnvironment
}) => Promise<{
	data: {
		resolvedPlugins: Awaited<ReturnType<ResolvePluginsFunction>>
		resolvedLintRules: LintRule[]
	}
	errors: Array<ModuleError | ModuleImportError>
}>

/**
 * The API after resolving the modules.
 */
export type ResolvedModulesApi = {
	resolvedPlugins: Awaited<ReturnType<ResolvePluginsFunction>>["data"]["plugins"]
	resolvedLintRules: LintRule[]
}
