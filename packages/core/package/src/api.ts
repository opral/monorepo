import type { ProjectConfig } from "@inlang/project-config"
import type { LintRule } from "@inlang/lint-rule"
import type { Plugin } from "@inlang/plugin"
import type {
	NodeishFilesystemSubset,
	ResolvePluginsFunction,
	ResolvedPluginApi,
} from "@inlang/resolve-plugins"
import type { PackageHasNoExportsError, PackageImportError } from "./errors.js"
import type { ImportFunction } from "./import.js"
import type { resolveLintRules } from "@inlang/lint"

/**
 * The inlang package API.
 *
 * An inlang package exports a default object with the following properties:
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

export type InlangPackage = {
	default: {
		plugins?: Plugin<any>[]
		lintRules?: LintRule[]
	}
}

/**
 * Function that resolves packages from the config.
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolvePackagesFunction = (args: {
	config: ProjectConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) => Promise<{
	/**
	 * Metadata about the resolved packages.
	 *
	 * @example
	 * [{
	 * 	  package: "https://myplugin.com/index.js",
	 * 	  plugins: ["samuel.plugin.json", "inlang.plugin.yaml"],
	 * 	  lintRules: ["samuel.lintRule.missingPattern", "inlang.lintRule.missingDescription"],
	 * }]
	 */
	meta: Array<{
		/**
		 * The package link.
		 *
		 * @example "https://myplugin.com/index.js"
		 */
		package: string
		/**
		 * The resolved plugin ids of the package.
		 *
		 * @example ["samuel.plugin.json", "inlang.plugin.yaml"]
		 */
		plugins: Array<Plugin["meta"]["id"]>
		/**
		 * The resolved lint rule ids of the package.
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
	 * The resolved api provided by plugins.
	 */
	resolvedPluginApi: ResolvedPluginApi
	/**
	 * Errors during the resolution process.
	 *
	 * This includes errors from:
	 * - importing packages
	 * - resolving plugins
	 * - resolving lint rules
	 * - resolving the runtime plugin api
	 */
	errors: Array<
		| PackageHasNoExportsError
		| PackageImportError
		| Awaited<ReturnType<ResolvePluginsFunction>>["errors"][number]
		| Awaited<ReturnType<typeof resolveLintRules>>["errors"][number]
	>
}>
