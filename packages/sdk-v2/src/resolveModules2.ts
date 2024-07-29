import {
	ModuleError,
	ModuleImportError,
	ModuleHasNoExportsError,
	ModuleExportIsInvalidError,
	ModuleSettingsAreInvalidError,
} from "./resolve-modules/errors.js"
import { tryCatch } from "@inlang/result"
import { resolvePlugins2 } from "./resolvePlugins2.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { validatedModuleSettings } from "./validatedModuleSettings.js"
import type { Plugin2 } from "./types/plugin.js"
import { InlangPlugin, type ResolveModule2Function } from "./types/module.js"

const ModuleCompiler = TypeCompiler.Compile(InlangPlugin)

export const resolveModules: ResolveModule2Function = async (args) => {
	const _import = args._import

	const allPlugins: Array<Plugin2> = []
	const meta: Awaited<ReturnType<ResolveModule2Function>>["meta"] = []
	const moduleErrors: Array<ModuleError> = []

	async function resolveModule(module: string) {
		const importedModule = await tryCatch<InlangPlugin>(() => _import(module))

		// -- FAILED TO IMPORT --
		if (importedModule.error) {
			moduleErrors.push(
				new ModuleImportError({
					module: module,
					cause: importedModule.error as Error,
				})
			)
			return
		}

		// -- MODULE DOES NOT EXPORT ANYTHING --
		if (importedModule.data?.default === undefined) {
			moduleErrors.push(
				new ModuleHasNoExportsError({
					module: module,
				})
			)
			return
		}

		// -- CHECK IF MODULE IS SYNTACTICALLY VALID
		const isValidModule = ModuleCompiler.Check(importedModule.data)
		if (!isValidModule) {
			const errors = [...ModuleCompiler.Errors(importedModule.data)]
			moduleErrors.push(
				new ModuleExportIsInvalidError({
					module: module,
					errors,
				})
			)

			return
		}

		// -- VALIDATE MODULE SETTINGS
		const result = validatedModuleSettings({
			settingsSchema: importedModule.data.default.settingsSchema,
			moduleSettings: (args.settings as any)[importedModule.data.default.id],
		})
		if (result !== "isValid") {
			moduleErrors.push(new ModuleSettingsAreInvalidError({ module: module, errors: result }))
			return
		}

		meta.push({
			module: module,
			id: importedModule.data.default.id,
		})

		if (importedModule.data.default.id.startsWith("plugin.")) {
			allPlugins.push(importedModule.data.default as Plugin2)
		} else {
			moduleErrors.push(
				new ModuleError(
					`Unimplemented module type ${importedModule.data.default.id}. The module has not been installed.`,
					{ module: module }
				)
			)
		}
	}

	await Promise.all(args.settings.modules.map(resolveModule))
	const resolvedPlugins = await resolvePlugins2({
		plugins: allPlugins,
		settings: args.settings,
	})

	return {
		meta,
		plugins: allPlugins,
		resolvedPluginApi: resolvedPlugins.data,
		errors: [...moduleErrors, ...resolvedPlugins.errors],
	}
}
