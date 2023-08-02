import { Plugin, pluginIdRegex, ResolvePluginsFunction } from "./api.js"
import { PluginError, PluginFunctionLoadMessagesAlreadyDefinedError, PluginFunctionSaveMessagesAlreadyDefinedError, PluginInvalidIdError, PluginUsesInvalidApiError, PluginUsesReservedNamespaceError } from "./errors.js"
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
		const pluginId = plugin.meta.id

		try {
			plugin.setup?.({
				options: args.pluginSettings?.[pluginId]?.options,
				fs: args.env.$fs,
			})

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

			// -- USES UNAVAILABLE API / WILDCARD --
			const parsed = tryCatch(() => Plugin.parse(plugin))

			if (parsed.error) {
				result.errors.push(
					new PluginUsesInvalidApiError(`Plugin ${plugin.meta.id} uses invalid API.`, {
						plugin: plugin.meta.id,
						cause: parsed.error as Error,
					}),
				)
			}

			// -- ALREADY DEFINED LOADMESSAGES / SAVEMESSAGES --
			if (
				typeof plugin.loadMessages === "function" &&
				result.data.loadMessages !== undefined
			) {
				result.errors.push(
					new PluginFunctionLoadMessagesAlreadyDefinedError(
						`Plugin ${plugin.meta.displayName} defines the loadMessages function, but it was already defined by another plugin.`,
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
						`Plugin ${plugin.meta.displayName} defines the saveMessages function, but it was already defined by another plugin.`,
						{ plugin: plugin.meta.id },
					),
				)
			}

			if (result.errors.length > 0) {				
				continue
			}

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

			if (typeof plugin.loadMessages === "function") {
				result.data.loadMessages = async () =>
					await plugin.loadMessages!({ languageTags: args.config.languageTags })
			}

			if (typeof plugin.saveMessages === "function") {
				result.data.saveMessages = async (args: any) => await plugin.saveMessages!(args)
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

			result.data.meta = {
				...result.data.meta,
				[pluginId]: {
					...plugin.meta,
					module: args.module,
				},
			}
		} catch (e) {
			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof PluginError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(new PluginError(e.message, { plugin: pluginId, cause: e }))
			} else {
				result.errors.push(
					new PluginError("Unhandled and unknown error", {
						plugin: pluginId,
						cause: e,
					}),
				)
			}
			continue
		}
	}

	return result as any
}
