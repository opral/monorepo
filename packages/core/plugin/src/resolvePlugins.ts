import { Plugin, ResolvePluginsFunction } from "./api.js"
import {
	PluginAppSpecificApiReturnError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"
import { deepmerge } from "deepmerge-ts"
import { TypeCompiler } from "@sinclair/typebox/compiler"

const whitelistedPlugins = ["inlang.plugin-json", "inlang.plugin-i18next"]

const PluginCompiler = TypeCompiler.Compile(Plugin)

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
		const errors = [...PluginCompiler.Errors(plugin)]

		/**
		 * -------------- RESOLVE PLUGIN --------------
		 */

		// -- INVALID ID in META --
		const hasInvalidId = errors.some((error) => error.path === "/meta/id")
		if (hasInvalidId) {
			result.errors.push(
				new PluginUsesInvalidIdError(
					`Plugin ${plugin.meta.id} has an invalid id "${plugin.meta.id}". It must be kebap-case and contain a namespace like project.my-plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		// -- USES RESERVED NAMESPACE --
		if (plugin.meta.id.includes("inlang") && !whitelistedPlugins.includes(plugin.meta.id)) {
			result.errors.push(
				new PluginUsesReservedNamespaceError(
					`Plugin ${plugin.meta.id} uses reserved namespace 'inlang'.`,
					{
						plugin: plugin.meta.id,
					},
				),
			)
		}

		// -- USES INVALID SCHEMA --
		if (errors.length > 0) {
			result.errors.push(
				new PluginUsesInvalidSchemaError(
					`Plugin ${plugin.meta.id} uses an invalid schema. Please check the documentation for the correct type.`,
					{
						plugin: plugin.meta.id,
						cause: errors,
					},
				),
			)
		}

		// -- ALREADY DEFINED LOADMESSAGES / SAVEMESSAGES --
		if (typeof plugin.loadMessages === "function" && result.data.loadMessages !== undefined) {
			result.errors.push(
				new PluginFunctionLoadMessagesAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the loadMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		if (typeof plugin.saveMessages === "function" && result.data.saveMessages !== undefined) {
			result.errors.push(
				new PluginFunctionSaveMessagesAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the saveMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		// --- ADD APP SPECIFIC API ---
		if (typeof plugin.addAppSpecificApi === "function") {
			const appSpecificApi = plugin.addAppSpecificApi({
				options: args.pluginSettings[plugin.meta.id]?.options,
			})
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
			const appSpecificApi = plugin.addAppSpecificApi({
				options: args.pluginSettings[plugin.meta.id]?.options,
			})
			result.data.appSpecificApi = deepmerge(result.data.appSpecificApi || {}, appSpecificApi)
		}

		result.data.meta[plugin.meta.id] = {
			...plugin.meta,
			module: args.module,
		}
	}

	return result as any
}
