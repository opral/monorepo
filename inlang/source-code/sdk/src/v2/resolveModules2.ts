import {
	ModuleError,
	ModuleImportError,
	ModuleHasNoExportsError,
	ModuleExportIsInvalidError,
	ModuleSettingsAreInvalidError,
} from "../resolve-modules/errors.js"
import { tryCatch } from "@inlang/result"
import { resolveMessageBundleLintRules } from "./resolveMessageBundleLintRules.js"
import { createImport } from "../resolve-modules/import.js"
import { resolvePlugins2 } from "./resolvePlugins2.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { validatedModuleSettings } from "./validatedModuleSettings.js"
import type { Plugin2 } from "./types/plugin.js"
import { InlangModule, type ResolveModule2Function } from "./types/module.js"
import type { MessageBundleLintRule } from "./types/lint.js"

const ModuleCompiler = TypeCompiler.Compile(InlangModule)

export const resolveModules: ResolveModule2Function = async (args) => {
	const _import = args._import ?? createImport(args.projectPath, args.nodeishFs)

	const allPlugins: Array<Plugin2> = []
	const allMessageLintRules: Array<MessageBundleLintRule> = []
	const meta: Awaited<ReturnType<ResolveModule2Function>>["meta"] = []
	const moduleErrors: Array<ModuleError> = []

	async function resolveModule(module: string) {
		const importedModule = await tryCatch<InlangModule>(() => _import(module))

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

		// -- CHECK IF MODULE IS SYNTACTIALLY VALID
		const isValidModule = ModuleCompiler.Check(importedModule.data)
		if (isValidModule === false) {
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
			moduleSettings: args.settings[importedModule.data.default.id],
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
		} else if (importedModule.data.default.id.startsWith("messageLintRule.")) {
			allMessageLintRules.push(importedModule.data.default as MessageBundleLintRule)
		} else {
			moduleErrors.push(
				new ModuleError(
					`Unimplemented module type ${importedModule.data.default.id}.The module has not been installed.`,
					{ module: module }
				)
			)
		}
	}

	await Promise.all(args.settings.modules.map(resolveModule))
	const resolvedPlugins = await resolvePlugins2({
		plugins: allPlugins,
		settings: args.settings,
		nodeishFs: args.nodeishFs,
	})

	const resolvedLintRules = resolveMessageBundleLintRules({ messageLintRules: allMessageLintRules })

	return {
		meta,
		messageBundleLintRules: allMessageLintRules,
		plugins: allPlugins,
		resolvedPluginApi: resolvedPlugins.data,
		errors: [...moduleErrors, ...resolvedLintRules.errors, ...resolvedPlugins.errors],
	}
}
