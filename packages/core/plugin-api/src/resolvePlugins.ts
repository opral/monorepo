import { $ImportError } from "@inlang/environment"
import type { ResolvePlugins, ResolvedPluginsApi } from "./api.js"
import { PluginApi } from "./api.js"
import {
	PluginApiAlreadyDefinedError,
	PluginError,
	PluginImportError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"

/**
 * Plugin ids that should be excluded by namespace reserving.
 */
export const whitelistedPlugins = [
	"inlang.plugin-json",
	"inlang.plugin-standard-lint-rules",
	"inlang.plugin-i18next",
]

/**
 * Resolves plugins from the config.
 */
export const resolvePlugins: ResolvePlugins = async (args) => {
	const result: {
		data: Partial<ResolvedPluginsApi> &
			Pick<ResolvedPluginsApi, "lintRules" | "plugins" | "appSpecificApi">
		errors: PluginError[]
	} = {
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

			const module = await args.env.$import(pluginInConfig.module)
			console.log("module", module.default.meta)
			const plugin = PluginApi.parse(module.default)
			const api = plugin.setup({ config: args.config, options: pluginInConfig.options })
			const lintRules = api.addLintRules?.() ?? []
			const appSpecificApi = api.addAppSpecificApi?.() ?? {}

			/**
			 * -------------- BEGIN VALIDATION --------------
			 */

			// -- USES RESERVED NAMESPACE --
			if (plugin.meta.id.includes("inlang") && !whitelistedPlugins.includes(plugin.meta.id)) {
				throw new PluginUsesReservedNamespaceError("Plugin uses reserved namespace 'inlang'.", {
					module: pluginInConfig.module,
				})
			}

			// -- ALREADY DEFINED API --
			for (const key of Object.keys(api)) {
				if (key === "addAppSpecificApi") {
					continue
				} else if (result.data[key as keyof typeof result.data] !== undefined) {
					throw new PluginApiAlreadyDefinedError(
						`Plugin ${pluginInConfig.module} defines a property ${key} that is already defined by another plugin.`,
						{ module: pluginInConfig.module },
					)
				}
			}

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

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
			} else if (e instanceof $ImportError) {
				result.errors.push(
					new PluginImportError(`Couldn't import the module "${pluginInConfig.module}"`, {
						module: pluginInConfig.module,
						cause: e,
					}),
				)
			} else if (e instanceof Error) {
				result.errors.push(new PluginError(e.message, { module: pluginInConfig.module, cause: e }))
			}
			result.errors.push(
				new PluginError("Unhandled and unknown error", { module: pluginInConfig.module, cause: e }),
			)
			continue
		}
	}

	return result as any
}
