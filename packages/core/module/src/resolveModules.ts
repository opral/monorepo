import type { InlangModule, ResolveModulesFunction } from "./api.js"
import { ModuleError, ModuleImportError, ModuleHasNoExportsError } from "./errors.js"
import { tryCatch } from "@inlang/result"
import { LintRule, resolveLintRules } from "@inlang/lint"
import { resolvePlugins, type Plugin } from "@inlang/plugin"
import { createImport } from "./import.js"

export const resolveModules: ResolveModulesFunction = async (args) => {
	const _import = args._import ?? createImport({ readFile: args.nodeishFs.readFile, fetch })
	const moduleErrors: Array<ModuleError> = []

	let allPlugins: Array<Plugin> = []
	let allLintRules: Array<LintRule> = []

	const meta: Awaited<ReturnType<ResolveModulesFunction>>["meta"] = []

	for (const module of args.config.modules) {
		/**
		 * -------------- BEGIN SETUP --------------
		 */

		const importedModule = await tryCatch<InlangModule>(() => _import(module))

		// -- IMPORT MODULE --
		if (importedModule.error) {
			moduleErrors.push(
				new ModuleImportError(`Couldn't import the plugin "${module}"`, {
					module,
					cause: importedModule.error as Error,
				}),
			)
			continue
		}

		// -- MODULE DOES NOT EXPORT PLUGINS OR LINT RULES --
		if (!importedModule.data?.default?.plugins && !importedModule.data?.default?.lintRules) {
			moduleErrors.push(
				new ModuleHasNoExportsError(
					`Module "${module}" does not export any plugins or lintRules.`,
					{
						module,
					},
				),
			)
			continue
		}

		const plugins = importedModule.data.default.plugins ?? []
		const lintRules = importedModule.data.default.lintRules ?? []

		meta.push({
			module,
			plugins: plugins.map((plugin) => plugin.meta.id) ?? [],
			lintRules: lintRules.map((lintRule) => lintRule.meta.id) ?? [],
		})

		allPlugins = [...allPlugins, ...plugins]
		allLintRules = [...allLintRules, ...lintRules]
	}

	const resolvedPlugins = resolvePlugins({
		plugins: allPlugins,
		settings: args.config.settings,
		nodeishFs: args.nodeishFs,
	})

	const resolvedLintRules = resolveLintRules({ lintRules: allLintRules })

	return {
		meta,
		lintRules: allLintRules,
		plugins: allPlugins,
		runtimePluginApi: resolvedPlugins.data,
		errors: [...moduleErrors, ...resolvedLintRules.errors, ...resolvedPlugins.errors],
	}
}
