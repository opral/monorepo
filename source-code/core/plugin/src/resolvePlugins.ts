import type { ResolvePlugins, ResolvedPluginsApi, Plugin } from "./api.js"
import {
	PluginException,
	PluginFunctionLoadMessagesAlreadyDefinedException,
	PluginFunctionSaveMessagesAlreadyDefinedException,
	PluginImportException,
} from "./exceptions.js"
import { tryCatch } from "@inlang/result"
import { parsePlugin } from "./parsePlugin.js"
import { validatePlugins } from "./validatePlugins.js"

export type ResolvePluginResult = {
	data: Partial<ResolvedPluginsApi> &
		Pick<ResolvedPluginsApi, "lintRules" | "plugins" | "appSpecificApi">
	errors: PluginException[]
}

/**
 * Resolves plugins from the config.
 */
export const resolvePlugins: ResolvePlugins = async (args) => {
	const result: ResolvePluginResult = {
		data: {
			plugins: [],
			lintRules: [],
			appSpecificApi: {},
		},
		errors: [],
	}

	for (const pluginInConfig of args.config.plugins) {
		try {
			/**
			 * -------------- BEGIN SETUP --------------
			 */

			const module = await tryCatch(() => args.env.$import(pluginInConfig.module))

			// -- IMPORT ERROR --
			if (module.error) {
				result.errors.push(
					new PluginImportException(`Couldn't import the plugin "${pluginInConfig.module}"`, {
						module: pluginInConfig.module,
						cause: module.error as Error,
					}),
				)
			}

			const plugin = module.data.default as Plugin
			const setup = plugin.setup?.({
				options: pluginInConfig.options,
				config: args.config,
			})
			const lintRules = plugin.addLintRules?.() ?? []
			const appSpecificApi = plugin.addAppSpecificApi?.() ?? {}

			/**
			 * -------------- PARSE & VALIDATE PLUGIN --------------
			 */

			// --- PARSE PLUGIN ---
			const parsed = parsePlugin({
				maybeValidPlugin: plugin,
			})

			if (parsed.errors) {
				result.errors.push(...parsed.errors)
			}

			// --- VALIDATE PLUGINS ---
			const validated = validatePlugins({
				plugins: result,
				plugin,
				pluginInConfig,
			})

			if (validated.errors) {
				result.errors.push(...validated.errors)
			}

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

			if (typeof plugin.loadMessages === "function") {
				result.data.loadMessages = async () => await plugin.loadMessages!(args)
			}

			if (typeof plugin.saveMessages === "function") {
				result.data.saveMessages = async (args) => await plugin.saveMessages!(args)
			}

			result.data.appSpecificApi = {
				...result.data.appSpecificApi,
				...appSpecificApi,
			}

			result.data.plugins.push({
				...plugin.meta,
				module: pluginInConfig.module,
			})

			for (const lintRule of lintRules) {
				result.data.lintRules.push(lintRule)
			}
		} catch (e) {
			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof PluginException) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(
					new PluginException(e.message, { module: pluginInConfig.module, cause: e }),
				)
			} else {
				result.errors.push(
					new PluginException("Unhandled and unknown error", {
						module: pluginInConfig.module,
						cause: e,
					}),
				)
			}
			continue
		}
	}

	return result as any
}
