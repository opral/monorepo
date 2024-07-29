/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ResolvePlugins2Function } from "./types/index.js"
import { Plugin } from "@inlang/plugin"
import {
	PluginReturnedInvalidCustomApiError,
	PluginImportFilesFunctionAlreadyDefinedError,
	PluginExportFilesFunctionAlreadyDefinedError,
	PluginToBeImportedFilesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginsDoNotProvideImportOrExportFilesError,
} from "./types/plugin-errors.js"
import { deepmerge } from "deepmerge-ts"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { tryCatch } from "@inlang/result"

// @ts-ignore - type mismatch error
const PluginCompiler = TypeCompiler.Compile(Plugin)

export const resolvePlugins2: ResolvePlugins2Function = async (args) => {
	const result: Awaited<ReturnType<ResolvePlugins2Function>> = {
		data: {
			toBeImportedFiles: undefined as any,
			importFiles: undefined as any,
			exportFiles: undefined as any,
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

		// -- ALREADY DEFINED IMPORTFILES / EXPORTFILES / DETECTEDLANGUAGETAGS --
		if (
			typeof plugin.toBeImportedFiles === "function" &&
			result.data.toBeImportedFiles !== undefined
		) {
			result.errors.push(new PluginToBeImportedFilesFunctionAlreadyDefinedError({ id: plugin.id }))
		}

		if (typeof plugin.importFiles === "function" && result.data.importFiles !== undefined) {
			result.errors.push(new PluginImportFilesFunctionAlreadyDefinedError({ id: plugin.id }))
		}

		if (typeof plugin.exportFiles === "function" && result.data.exportFiles !== undefined) {
			result.errors.push(new PluginExportFilesFunctionAlreadyDefinedError({ id: plugin.id }))
		}

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

		if (typeof plugin.toBeImportedFiles === "function") {
			result.data.toBeImportedFiles = [
				...(result.data.toBeImportedFiles ?? []),
				plugin.toBeImportedFiles,
			]
		}

		if (typeof plugin.importFiles === "function") {
			result.data.importFiles = [...(result.data.importFiles ?? []), plugin.importFiles]
		}

		if (typeof plugin.exportFiles === "function") {
			result.data.exportFiles = [...(result.data.exportFiles ?? []), plugin.exportFiles]
		}

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

	if (
		!experimentalPersistence &&
		(typeof result.data.importFiles !== "function" || typeof result.data.exportFiles !== "function")
	) {
		result.errors.push(new PluginsDoNotProvideImportOrExportFilesError())
	}

	return result
}
