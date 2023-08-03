import { Plugin, pluginIdRegex, ResolvePluginsFunction } from "./api.js"
import { PluginAppSpecificApiReturnError, PluginError, PluginFunctionLoadMessagesAlreadyDefinedError, PluginFunctionSaveMessagesAlreadyDefinedError, PluginInvalidIdError, PluginUsesInvalidApiError, PluginUsesReservedNamespaceError } from "./errors.js"
import { tryCatch } from "@inlang/result"
import { deepmerge } from "deepmerge-ts"

const whitelistedPlugins = ["inlang.plugin-json", "inlang.plugin-i18next"]

export const resolvePlugins: ResolvePluginsFunction = (args) => {
	const result: Awaited<ReturnType<ResolvePluginsFunction>> = {
		data: {
			loadMessages: undefined,
			saveMessages: undefined,
			appSpecificApi: {},
			meta: {},
		},
		errors: [],
	}

	for (const plugin of args.plugins) {
		/**
		 * -------------- RESOLVE PLUGIN --------------
		 */

		// -- INVALID ID in META --
		if (new RegExp(pluginIdRegex).test(plugin.meta.id) === false) {
			result.errors.push(
				new PluginInvalidIdError(
					`Plugin ${plugin.meta.id} has an invalid id "${plugin.meta.id}". It must be kebap-case and contain a namespace like project.my-plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		// -- USES RESERVED NAMESPACE --
		if (
			plugin.meta.id.includes("inlang") &&
			!whitelistedPlugins.includes(plugin.meta.id)
		) {
			result.errors.push(
				new PluginUsesReservedNamespaceError(
					`Plugin ${plugin.meta.id} uses reserved namespace 'inlang'.`,
					{
						plugin: plugin.meta.id,
					},
				),
			)
		}

		// -- USES INVALID API --
		const pluginSchema = Plugin.safeParse(plugin)
		if (pluginSchema.success === false) {
			result.errors.push(
				new PluginUsesInvalidApiError(
					`Plugin ${plugin.meta.id} uses invalid API. Please check the type of the exposed plugin.`,
					{
						plugin: plugin.meta.id,
						cause: pluginSchema.error,
					},
				),
			)
		}

		// -- ALREADY DEFINED LOADMESSAGES / SAVEMESSAGES --
		if (
			typeof plugin.loadMessages === "function" &&
			result.data.loadMessages !== undefined
		) {
			result.errors.push(
				new PluginFunctionLoadMessagesAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the loadMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}
		
		if (
			typeof plugin.saveMessages === "function" &&
			result.data.saveMessages !== undefined
		) {
			result.errors.push(
				new PluginFunctionSaveMessagesAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the saveMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		// --- ADD APP SPECIFIC API ---
		if (typeof plugin.addAppSpecificApi === "function") {
			const appSpecificApi = plugin.addAppSpecificApi()
			if (typeof appSpecificApi !== "object") {
				result.errors.push(
					new PluginAppSpecificApiReturnError(
						`Plugin ${plugin.meta.id} defines the addAppSpecificApi function, but it does not return an object.`,
						{ plugin: plugin.meta.id },
					),
				)
			}
		}

		// -- CONTINUE IF ERRORS --
		if (result.errors.length > 0) {					
			continue
		}

		/**
		 * -------------- BEGIN ADDING TO RESULT --------------
		 */

		if (typeof plugin.loadMessages === "function") {
			result.data.loadMessages = plugin.loadMessages
		}

		if (typeof plugin.saveMessages === "function") {
			result.data.saveMessages = plugin.saveMessages
		}

		if (typeof plugin.addAppSpecificApi === "function") {
			const appSpecificApi = plugin.addAppSpecificApi()
			for (const [namespace, api] of Object.entries(appSpecificApi)) {
				result.data.appSpecificApi[namespace] = deepmerge(
					result.data.appSpecificApi[namespace] || {},
					api,
				)
			}
		}

		result.data.meta[plugin.meta.id] = {
			...plugin.meta,
			module: args.module,
		}
	}

	return result as any
}
