import type { ResolveModuleFunction } from "./types.js"
import { InlangModule } from "@inlang/module"
import {
	ModuleError,
	ModuleImportError,
	ModuleHasNoExportsError,
	ModuleExportIsInvalidError,
	ModuleSettingsAreInvalidError,
} from "./errors.js"
import { tryCatch } from "@inlang/result"
import { resolveMessageLintRules } from "./message-lint-rules/resolveMessageLintRules.js"
import type { Plugin } from "@inlang/plugin"
import { createImport } from "./import.js"
import type { MessageLintRule } from "@inlang/message-lint-rule"
import { resolvePlugins } from "./plugins/resolvePlugins.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { validatedModuleSettings } from "./validatedModuleSettings.js"

const ModuleCompiler = TypeCompiler.Compile(InlangModule)

export const resolveModules: ResolveModuleFunction = async (args) => {
	const _import = args._import ?? createImport({ readFile: args.nodeishFs.readFile })
	const moduleErrors: Array<ModuleError> = []

	const allPlugins: Array<Plugin> = []
	const allMessageLintRules: Array<MessageLintRule> = []

	const meta: Awaited<ReturnType<ResolveModuleFunction>>["meta"] = []

	for (const module of args.settings.modules) {
		/**
		 * -------------- BEGIN SETUP --------------
		 */

		const importedModule = await tryCatch<InlangModule>(() => _import(module))
		// -- IMPORT MODULE --

		if (importedModule.error) {
			moduleErrors.push(
				new ModuleImportError({
					module: module,
					cause: importedModule.error as Error,
				})
			)
			continue
		}

		// -- MODULE DOES NOT EXPORT ANYTHING --

		if (importedModule.data?.default === undefined) {
			moduleErrors.push(
				new ModuleHasNoExportsError({
					module: module,
				})
			)
			continue
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

			continue
		}

		// -- VALIDATE MODULE SETTINGS

		const result = validatedModuleSettings({
			settingsSchema: importedModule.data.default.settingsSchema,
			moduleSettings: args.settings[importedModule.data.default.id],
		})
		if (result !== "isValid") {
			moduleErrors.push(new ModuleSettingsAreInvalidError({ module: module, errors: result }))
			continue
		}

		meta.push({
			module: module,
			id: importedModule.data.default.id,
		})

		if (importedModule.data.default.id.startsWith("plugin.")) {
			allPlugins.push(importedModule.data.default as Plugin)
		} else if (importedModule.data.default.id.startsWith("messageLintRule.")) {
			allMessageLintRules.push(importedModule.data.default as MessageLintRule)
		} else {
			moduleErrors.push(
				new ModuleError(
					`Unimplemented module type ${importedModule.data.default.id}.The module has not been installed.`,
					{ module: module }
				)
			)
		}
	}
	const resolvedPlugins = await resolvePlugins({
		plugins: allPlugins,
		settings: args.settings,
		nodeishFs: args.nodeishFs,
	})

	const resolvedLintRules = resolveMessageLintRules({ messageLintRules: allMessageLintRules })

	return {
		meta,
		messageLintRules: allMessageLintRules,
		plugins: allPlugins,
		resolvedPluginApi: resolvedPlugins.data,
		errors: [...moduleErrors, ...resolvedLintRules.errors, ...resolvedPlugins.errors],
	}
}
