import type { ZodError, ZodIssue } from "zod"
import type { ResolvePlugins, ResolvedPluginsApi, PluginApi } from "./api.js"
import { PluginError, PluginImportError } from "./errors.js"
import { Result, tryCatch } from "@inlang/result"
import { parsePlugin } from "./parsePlugin.js"

export type ResolvePluginResult = {
	data: Partial<ResolvedPluginsApi> &
		Pick<ResolvedPluginsApi, "lintRules" | "plugins" | "appSpecificApi">
	errors: PluginError[]
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

			if (module.error) {
				throw new PluginImportError(`Couldn't import the plugin "${pluginInConfig.module}"`, {
					module: pluginInConfig.module,
					cause: module.error as Error,
				})
			}

			const plugin = module.data.default as PluginApi
			const api = plugin.setup({ config: args.config, options: pluginInConfig.options })
			const lintRules = api.addLintRules?.() ?? []
			const appSpecificApi = api.addAppSpecificApi?.() ?? {}

			parsePlugin({
				config: args.config,
				plugin,
				pluginInConfig,
				result,
			})

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

			if (typeof api.loadMessages === "function") {
				result.data.loadMessages = async () => await api.loadMessages!(args)
			}

			if (typeof api.saveMessages === "function") {
				result.data.saveMessages = async (args) => await api.saveMessages!(args)
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
			if (e instanceof PluginError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(new PluginError(e.message, { module: pluginInConfig.module, cause: e }))
			} else {
				result.errors.push(
					new PluginError("Unhandled and unknown error", {
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
