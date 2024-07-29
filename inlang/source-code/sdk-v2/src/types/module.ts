import type { ProjectSettings2 } from "./project-settings.js"
import type { ImportFunction } from "../resolve-modules/import.js"
import { Plugin2, type ResolvePlugins2Function, type ResolvedPlugin2Api } from "./plugin.js"
import type { ModuleHasNoExportsError, ModuleImportError } from "./module-errors.js"
import { Type } from "@sinclair/typebox"

/**
 * An inlang plugin module has a default export that is a plugin.
 *
 * @example
 *   export default myPlugin
 */
// not using Static<infer T> here because the type is not inferred correctly
// due to type overwrites in modules.
export type InlangPlugin = { default: Plugin2 }
export const InlangPlugin = Type.Object({
	default: Plugin2,
})

/**
 * Function that resolves modules from the config.
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolveModule2Function = (args: {
	settings: ProjectSettings2
	_import: ImportFunction
}) => Promise<{
	/**
	 * Metadata about the resolved module.
	 *
	 * @example
	 * [{
	 * 	  id: "plugin.inlang.json",
	 * 	  module: "https://myplugin.com/index.js"
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
		 * The resolved item id of the module.
		 */
		id: Plugin2["id"]
	}>
	/**
	 * The resolved plugins.
	 */
	plugins: Array<Plugin2>
	/**
	 * The resolved api provided by plugins.
	 */
	resolvedPluginApi: ResolvedPlugin2Api
	/**
	 * Errors during the resolution process.
	 *
	 * This includes errors from:
	 * - importing module
	 * - resolving plugins
	 * - resolving the runtime plugin api
	 */
	errors: Array<
		| ModuleHasNoExportsError
		| ModuleImportError
		| Awaited<ReturnType<ResolvePlugins2Function>>["errors"][number]
	>
}>
