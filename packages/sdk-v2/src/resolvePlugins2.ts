/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ResolvePlugins2Function } from "./types/index.js"
import { Plugin } from "@inlang/plugin"
import {
	PluginReturnedInvalidCustomApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginsDoNotProvideLoadOrSaveMessagesError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
} from "./types/plugin-errors.js"
import { deepmerge } from "deepmerge-ts"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { tryCatch } from "@inlang/result"

// @ts-ignore - type mismatch error
const PluginCompiler = TypeCompiler.Compile(Plugin)

export const resolvePlugins2: ResolvePlugins2Function = async (args) => {
	const result: Awaited<ReturnType<ResolvePlugins2Function>> = {
		data: {
			// loadMessages: undefined as any,
			// saveMessages: undefined as any,
			customApi: {},
		},
		errors: [],
	}

	const experimentalPersistence = !!args.settings.experimental?.persistence
	if (experimentalPersistence) {
		// debug("Using experimental persistence")
	}

	for (const plugin of args.plugins) {
		const errors = [...PluginCompiler.Errors(plugin)]

		/**
		 * -------------- RESOLVE PLUGIN --------------
		 */

		// -- INVALID ID in META --
		const hasInvalidId = errors.some((error) => error.path === "/id")
		if (hasInvalidId) {
			result.errors.push(new PluginHasInvalidIdError({ id: plugin.id }))
		}

		// -- USES INVALID SCHEMA --
		if (errors.length > 0) {
			result.errors.push(
				new PluginHasInvalidSchemaError({
					id: plugin.id,
					errors: errors,
				})
			)
		}

		// -- ALREADY DEFINED LOADMESSAGES / SAVEMESSAGES / DETECTEDLANGUAGETAGS --
		// TODO SDK-v2 IMPORT/EXPORT check if we can reuse this for export/import
		// if (typeof plugin.loadMessages === "function" && result.data.loadMessages !== undefined) {
		// 	result.errors.push(new PluginLoadMessagesFunctionAlreadyDefinedError({ id: plugin.id }))
		// }

		// if (typeof plugin.saveMessages === "function" && result.data.saveMessages !== undefined) {
		// 	result.errors.push(new PluginSaveMessagesFunctionAlreadyDefinedError({ id: plugin.id }))
		// }

		// --- ADD APP SPECIFIC API ---
		if (typeof plugin.addCustomApi === "function") {
			// TODO: why do we call this function 2 times (here for validation and later for retrieving the actual value)?
			const { data: customApi, error } = tryCatch(() =>
				plugin.addCustomApi!({
					settings: args.settings,
				})
			)
			if (error) {
				result.errors.push(new PluginReturnedInvalidCustomApiError({ id: plugin.id, cause: error }))
			} else if (typeof customApi !== "object") {
				result.errors.push(
					new PluginReturnedInvalidCustomApiError({
						id: plugin.id,
						cause: new Error(`The return value must be an object. Received "${typeof customApi}".`),
					})
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

		// TODO SDK-v2 IMPORT/EXPORT we remove load/save Message for now
		// if (typeof plugin.loadMessages === "function") {
		// 	result.data.loadMessages = plugin.loadMessages
		// }

		// if (typeof plugin.saveMessages === "function") {
		// 	result.data.saveMessages = plugin.saveMessages
		// }

		if (typeof plugin.addCustomApi === "function") {
			const { data: customApi } = tryCatch(() =>
				plugin.addCustomApi!({
					settings: args.settings,
				})
			)
			if (customApi) {
				result.data.customApi = deepmerge(result.data.customApi, customApi)
			}
		}
	}

	// --- LOADMESSAGE / SAVEMESSAGE NOT DEFINED ---

	// TODO SDK-v2 IMPORT/EXPORT check if we can use that for exporter importer
	// if (
	// 	!experimentalPersistence &&
	// 	(typeof result.data.loadMessages !== "function" ||
	// 		typeof result.data.saveMessages !== "function")
	// ) {
	// 	result.errors.push(new PluginsDoNotProvideLoadOrSaveMessagesError())
	// }

	return result
}
