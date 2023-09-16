import type { ResolveModuleFunction } from "./types.js"
import { InlangModule } from "@inlang/module"
import {
	ModuleError,
	ModuleImportError,
	ModuleHasNoExportsError,
	ModuleExportIsInvalidError,
} from "./errors.js"
import { tryCatch } from "@inlang/result"
import { resolveMessageLintRules } from "./message-lint-rules/resolveMessageLintRules.js"
import type { Plugin } from "@inlang/plugin"
import { createImport } from "./import.js"
import type { MessageLintRule } from "@inlang/message-lint-rule"
import { resolvePlugins } from "./plugins/resolvePlugins.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"

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
				new ModuleImportError(`Couldn't import the plugin "${module}"`, {
					module: module,
					cause: importedModule.error as Error,
				}),
			)
			continue
		}

		// -- MODULE DOES NOT EXPORT ANYTHING --
		if (importedModule.data?.default === undefined) {
			moduleErrors.push(
				new ModuleHasNoExportsError(`Module "${module}" has no exports.`, {
					module: module,
				}),
			)
			continue
		}

		const isValidModule = ModuleCompiler.Check(importedModule.data)

		if (isValidModule === false) {
			const errors = [...ModuleCompiler.Errors(importedModule.data)].map(
				(e) => `${e.path} ${e.message}`,
			)
			moduleErrors.push(
				new ModuleExportIsInvalidError(`Module "${module}" is invalid: ` + errors.join("\n"), {
					module: module,
				}),
			)
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
			throw new Error(`Unimplemented module type. Must start with "plugin." or "messageLintRule.`)
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
