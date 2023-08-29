import type { InlangPackage, ResolvePackagesFunction } from "./api.js"
import { PackageError, PackageImportError, PackageHasNoExportsError } from "./errors.js"
import { tryCatch } from "@inlang/result"
import { LintRule, resolveLintRules } from "@inlang/lint"
import { resolvePlugins, type Plugin } from "@inlang/plugin"
import { createImport } from "./import.js"

export const resolvePackages: ResolvePackagesFunction = async (args) => {
	const _import = args._import ?? createImport({ readFile: args.nodeishFs.readFile, fetch })
	const packageErrors: Array<PackageError> = []

	let allPlugins: Array<Plugin> = []
	let allLintRules: Array<LintRule> = []

	const meta: Awaited<ReturnType<ResolvePackagesFunction>>["meta"] = []

	for (const module of args.config.packages) {
		/**
		 * -------------- BEGIN SETUP --------------
		 */

		const importedModule = await tryCatch<InlangPackage>(() => _import(module))

		// -- IMPORT MODULE --
		if (importedModule.error) {
			packageErrors.push(
				new PackageImportError(`Couldn't import the plugin "${module}"`, {
					package: module,
					cause: importedModule.error as Error,
				}),
			)
			continue
		}

		// -- MODULE DOES NOT EXPORT PLUGINS OR LINT RULES --
		if (!importedModule.data?.default?.plugins && !importedModule.data?.default?.lintRules) {
			packageErrors.push(
				new PackageHasNoExportsError(
					`Module "${module}" does not export any plugins or lintRules.`,
					{
						package: module,
					},
				),
			)
			continue
		}

		// TODO: check if module is valid using typebox

		const plugins = importedModule.data.default.plugins ?? []
		const lintRules = importedModule.data.default.lintRules ?? []

		meta.push({
			package: module,
			plugins: plugins.map((plugin) => plugin.meta.id) ?? [],
			lintRules: lintRules.map((lintRule) => lintRule.meta.id) ?? [],
		})

		allPlugins = [...allPlugins, ...plugins]
		allLintRules = [...allLintRules, ...lintRules]
	}

	const resolvedPlugins = await resolvePlugins({
		plugins: allPlugins,
		settings: args.config.settings as any, // TODO: fix type
		nodeishFs: args.nodeishFs,
	})

	const resolvedLintRules = resolveLintRules({ lintRules: allLintRules })

	return {
		meta,
		lintRules: allLintRules,
		plugins: allPlugins,
		resolvedPluginApi: resolvedPlugins.data,
		errors: [...packageErrors, ...resolvedLintRules.errors, ...resolvedPlugins.errors],
	}
}
