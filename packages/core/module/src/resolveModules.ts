import type { ResolvedModulesFunction } from "./api.js"
import { ModuleError, ModuleImportError } from "./errors.js"
import { tryCatch } from "@inlang/result"
import { LintRule } from "@inlang/lint"
import { ResolvePluginsFunction, resolvePlugins, type Plugin } from "@inlang/plugin"
import extend from "just-extend"
import { Value } from "@sinclair/typebox/value"

export const resolveModules: ResolvedModulesFunction = async (args) => {
	const pluginSettings = args.config.settings?.plugins || {}

	const result: Awaited<ReturnType<ResolvedModulesFunction>> = {
		data: {
			plugins: { data: {} as any, errors: [] },
			lintRules: [],
		},
		errors: [],
	}

	for (const module of args.config.modules) {
		try {
			/**
			 * -------------- BEGIN SETUP --------------
			 */

			const importedModule = await tryCatch(() => args.$import(module))

			// -- IMPORT MODULE --
			if (importedModule.error) {
				result.errors.push(
					new ModuleImportError(`Couldn't import the plugin "${module}"`, {
						module,
						cause: importedModule.error as Error,
					}),
				)
			}

			// -- MODULE DOES NOT EXPORT PLUGINS OR LINT RULES --
			if (!importedModule.data.default.plugins && !importedModule.data.default.lintRule) {
				result.errors.push(
					new ModuleError(`Module "${module}" does not export any plugins or lintRules.`, {
						module,
						cause: new Error(`Module "${module}" does not export any plugins or lintRules.`),
					}),
				)
				continue
			}

			// --- RESOLVE PLUGINS ---
			if (importedModule.data.default.plugins) {
				const plugins = importedModule.data.default.plugins as Plugin[]
				const resolvedPlugins = await resolvePlugins({
					module,
					plugins,
					pluginSettings,
				})

				// -- ADD RESOLVED PLUGINS TO RESULT --
				result.data.plugins = extend(result.data.plugins, resolvedPlugins) as Awaited<
					ReturnType<ResolvePluginsFunction>
				>
			}

			// --- PARSE LINT RULES ---
			if (importedModule.data.default.lintRules) {
				const lintRules = importedModule.data.default.lintRules as LintRule[]
				const parsedLintRules = lintRules.map((rule) => {
					const parsed = tryCatch(() => Value.Check(LintRule, rule))
					if (parsed.error) {
						result.errors.push(
							new ModuleError(
								`Couldn't parse lint rule "${rule.meta.id}" from module "${module}"`,
								{
									module,
									cause: parsed.error as Error,
								},
							),
						)
						return
					}
					return rule
				})

				// -- ADD PARSED LINT RULES TO RESULT --
				result.data.lintRules = extend(result.data.lintRules, parsedLintRules) as LintRule[]
			}
		} catch (e) {
			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof ModuleError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(new ModuleError(e.message, { module: module, cause: e }))
			} else {
				result.errors.push(
					new ModuleError("Unhandled and unknown error", {
						module: module,
						cause: e as Error,
					}),
				)
			}
			continue
		}
	}

	return result as any
}
