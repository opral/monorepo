import type { ResolvePlugins2Function } from "./types/index.js"
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
import { Plugin2 } from "./types/plugin.js"

const PluginCompiler = TypeCompiler.Compile(Plugin2)

export const resolvePlugins2: ResolvePlugins2Function = async (args) => {
	const result: Awaited<ReturnType<ResolvePlugins2Function>> = {
		data: {
			toBeImportedFiles: {},
			importFiles: {},
			exportFiles: {},
			customApi: {},
		},
		errors: [],
	}

	for (const plugin of args.plugins) {
		const errors = [...PluginCompiler.Errors(plugin)]

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

		// -- CHECK FOR ALREADY DEFINED FUNCTIONS --
		if (typeof plugin.toBeImportedFiles === "function") {
			if (result.data.toBeImportedFiles[plugin.id]) {
				result.errors.push(
					new PluginToBeImportedFilesFunctionAlreadyDefinedError({ id: plugin.id })
				)
			} else {
				result.data.toBeImportedFiles[plugin.id] = plugin.toBeImportedFiles
			}
		}

		if (typeof plugin.importFiles === "function") {
			if (result.data.importFiles[plugin.id]) {
				result.errors.push(new PluginImportFilesFunctionAlreadyDefinedError({ id: plugin.id }))
			} else {
				result.data.importFiles[plugin.id] = plugin.importFiles
			}
		}

		if (typeof plugin.exportFiles === "function") {
			if (result.data.exportFiles[plugin.id]) {
				result.errors.push(new PluginExportFilesFunctionAlreadyDefinedError({ id: plugin.id }))
			} else {
				result.data.exportFiles[plugin.id] = plugin.exportFiles
			}
		}

		// -- ADD APP SPECIFIC API --
		if (typeof plugin.addCustomApi === "function") {
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
			} else {
				result.data.customApi = deepmerge(result.data.customApi, customApi)
			}
		}

		// -- CONTINUE IF ERRORS --
		if (errors.length > 0) {
			continue
		}
	}

	// -- IMPORT / EXPORT NOT DEFINED FOR ANY PLUGIN --
	if (
		Object.keys(result.data.toBeImportedFiles).length === 0 &&
		Object.keys(result.data.importFiles).length === 0 &&
		Object.keys(result.data.exportFiles).length === 0
	) {
		result.errors.push(new PluginsDoNotProvideImportOrExportFilesError())
	}

	return result
}
