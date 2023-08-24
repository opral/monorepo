import { Plugin, ResolvePluginsFunction } from "./api.js"
import {
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"
import { deepmerge } from "deepmerge-ts"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { tryCatch } from "@inlang/result"

const whitelistedPlugins = ["inlang.plugin.json", "inlang.plugin.i18next", "inlang.plugin.sdkJs"]
const PluginCompiler = TypeCompiler.Compile(Plugin)

export const resolvePlugins: ResolvePluginsFunction = async (args) => {
	const result: Awaited<ReturnType<ResolvePluginsFunction>> = {
		data: {
			loadMessages: undefined as any,
			saveMessages: undefined as any,
			detectedLanguageTags: [],
			appSpecificApi: {},
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
				new PluginHasInvalidIdError(
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
				new PluginHasInvalidSchemaError(
					`Plugin ${plugin.meta.id} uses an invalid schema. Please check the documentation for the correct Plugin type.`,
					{
						plugin: plugin.meta.id,
						cause: errors,
					},
				),
			)
		}

		// -- ALREADY DEFINED LOADMESSAGES / SAVEMESSAGES / DETECTEDLANGUAGETAGS --
		if (typeof plugin.loadMessages === "function" && result.data.loadMessages !== undefined) {
			result.errors.push(
				new PluginLoadMessagesFunctionAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the loadMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		if (typeof plugin.saveMessages === "function" && result.data.saveMessages !== undefined) {
			result.errors.push(
				new PluginSaveMessagesFunctionAlreadyDefinedError(
					`Plugin ${plugin.meta.id} defines the saveMessages function, but it was already defined by another plugin.`,
					{ plugin: plugin.meta.id },
				),
			)
		}

		// --- ADD APP SPECIFIC API ---
		if (typeof plugin.addAppSpecificApi === "function") {
			// TODO: why do we call this function 2 times (here for validation and later for retrieving the actual value)?
			const { data: appSpecificApi, error } = tryCatch(() =>
				plugin.addAppSpecificApi!({
					settings: args.settings?.[plugin.meta.id] ?? {},
				}),
			)
			if (error) {
				// @ts-ignore
				delete error.stack
				result.errors.push(error as any) // TODO: add correct error type
			}
			if (typeof appSpecificApi !== "object") {
				result.errors.push(
					new PluginReturnedInvalidAppSpecificApiError(
						`Plugin ${plugin.meta.id} defines the addAppSpecificApi function, but it does not return an object.`,
						{ plugin: plugin.meta.id, cause: error },
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
			result.data.loadMessages = (_args) =>
				plugin.loadMessages!({
					..._args,
					settings: args.settings?.[plugin.meta.id] ?? {},
					nodeishFs: args.nodeishFs,
				})
		}

		if (typeof plugin.saveMessages === "function") {
			result.data.saveMessages = (_args) =>
				plugin.saveMessages!({
					..._args,
					settings: args.settings?.[plugin.meta.id] ?? {},
					nodeishFs: args.nodeishFs,
				})
		}

		if (typeof plugin.detectedLanguageTags === "function") {
			const detectedLangugeTags = await plugin.detectedLanguageTags!({
				settings: args.settings?.[plugin.meta.id] ?? {},
				nodeishFs: args.nodeishFs,
			})
			result.data.detectedLanguageTags = [
				...new Set([...result.data.detectedLanguageTags, ...detectedLangugeTags]),
			]
		}

		if (typeof plugin.addAppSpecificApi === "function") {
			const { data: appSpecificApi } = tryCatch(() =>
				plugin.addAppSpecificApi!({
					settings: args.settings?.[plugin.meta.id] ?? {},
				}),
			)
			if (appSpecificApi) {
				result.data.appSpecificApi = deepmerge(result.data.appSpecificApi, appSpecificApi)
			}
		}
	}

	return result
}
