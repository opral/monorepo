import type { InlangConfig } from "@inlang/config"
import type { LintRule, resolveLintRules } from "@inlang/lint"
import type {
	NodeishFilesystemSubset,
	Plugin,
	ResolvePluginsFunction,
	RuntimePluginApi,
} from "@inlang/plugin"
import type { ModuleHasNoExportsError, ModuleImportError } from "./errors.js"
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
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolveModulesFunction = (args: {
	config: InlangConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) => Promise<{
	/**
	 * Metadata about the resolved modules.
	 *
	 * @example
	 * [{
	 * 	  module: "https://myplugin.com/index.js",
	 * 	  plugins: ["samuel.plugin.json", "inlang.plugin.yaml"],
	 * 	  lintRules: ["samuel.lintRule.missingPattern", "inlang.lintRule.missingDescription"],
	 * }]
	 */
	meta: Array<{
		/**
		 * The module link.
		 *
		 * @example "https://myplugin.com/index.js"
		 */
		module: string
		/**
		 * The resolved plugin ids of the module.
		 *
		 * @example ["samuel.plugin.json", "inlang.plugin.yaml"]
		 */
		plugins: Array<Plugin["meta"]["id"]>
		/**
		 * The resolved lint rule ids of the module.
		 *
		 * @example ["samuel.lintRule.missingPattern", "inlang.lintRule.missingDescription"]
		 */
		lintRules: Array<LintRule["meta"]["id"]>
	}>
	/**
	 * The resolved plugins.
	 */
	plugins: Array<Plugin>
	/**
	 * The resolved lint rules.
	 */
	lintRules: Array<LintRule>
	/**
	 * The resolved runtime api provided by plugins.
	 */
	runtimePluginApi: RuntimePluginApi
	/**
	 * Errors during the resolution process.
	 *
	 * This includes errors from:
	 * - importing modules
	 * - resolving plugins
	 * - resolving lint rules
	 * - resolving the runtime plugin api
	 */
	errors: Array<
		| ModuleHasNoExportsError
		| ModuleImportError
		| Awaited<ReturnType<ResolvePluginsFunction>>["errors"][number]
		| Awaited<ReturnType<typeof resolveLintRules>>["errors"][number]
	>
}>
