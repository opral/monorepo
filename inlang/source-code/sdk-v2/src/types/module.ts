import type { ProjectSettings2 } from "./project-settings.js"
import type { ImportFunction } from "../resolve-modules/import.js"
import { Plugin2, type ResolvePlugins2Function, type ResolvedPlugin2Api } from "./plugin.js"
import { MessageBundleLintRule } from "./lint.js"
import type { ModuleHasNoExportsError, ModuleImportError } from "./module-errors.js"
import type { resolveMessageBundleLintRules } from "../resolveMessageBundleLintRules.js"
import { Type } from "@sinclair/typebox"

/**
 * An inlang module has a default export that is either a plugin or a message lint rule.
 *
 * @example
 *   export default myPlugin
 */
// not using Static<infer T> here because the type is not inferred correctly
// due to type overwrites in modules.
export type InlangModule = { default: Plugin2 | MessageBundleLintRule }
export const InlangModule = Type.Object({
	default: Type.Union([Plugin2, MessageBundleLintRule]),
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
		id: Plugin2["id"] | MessageBundleLintRule["id"]
	}>
	/**
	 * The resolved plugins.
	 */
	plugins: Array<Plugin2>
	/**
	 * The resolved message lint rules.
	 */
	messageBundleLintRules: Array<MessageBundleLintRule>
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
	 * - resolving lint rules
	 * - resolving the runtime plugin api
	 */
	errors: Array<
		| ModuleHasNoExportsError
		| ModuleImportError
		| Awaited<ReturnType<ResolvePlugins2Function>>["errors"][number]
		| Awaited<ReturnType<typeof resolveMessageBundleLintRules>>["errors"][number]
	>
}>
