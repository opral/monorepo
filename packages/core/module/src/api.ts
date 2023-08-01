import type { InlangConfig, LintRuleSettings } from '@inlang/config'
import type { LintRule } from "@inlang/lint"
import type { Plugin } from "@inlang/plugin"
import type { ModuleError, ModuleImportError } from './errors.js'
import type { InlangEnvironment } from '@inlang/environment'

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

/**
 * Function that resolves modules from the config.
 */
export type ResolvedModules = (args: {
	config: InlangConfig
	env: InlangEnvironment
}) => Promise<{
	data: {
		plugins: Record<string, Plugin['meta']>
		lintRules: Record<string, { module: LintRule, settings: LintRuleSettings }>
		appSpecificApi: Record<string, unknown>
	}
	errors: Array<
		| ModuleError
		| ModuleImportError
	>
}>

/**
 * The API after resolving the modules.
 */
export type ResolvedModulesApi = {
	plugins: Record<string, Plugin>
	lintRules: Record<string, LintRule>
	appSpecificApi: Record<string, unknown>
}