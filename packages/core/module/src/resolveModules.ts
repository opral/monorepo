import type { ResolvedModulesApi, ResolvedModulesFunction } from "./api.js"
import {
	ModuleError,
	ModuleImportError,
} from "./errors.js"
import { tryCatch } from "@inlang/result"
import type { InlangModule } from "@inlang/module"
import type { LintRule } from "@inlang/lint"
import { resolvePlugins, type Plugin } from "@inlang/plugin"

export type ResolveModuleResult = {
	data: Partial<ResolvedModulesApi> & Pick<ResolvedModulesApi, "resolvedPlugins" | "resolvedLintRules">
	errors: Array<ModuleError>
}

/**
 * Resolves plugins from the config.
 */
export const resolveModules: ResolvedModulesFunction = async (args) => {
	const pluginsInConfig = args.config.settings?.plugins

	const result: ResolveModuleResult = {
		data: {
			resolvedPlugins: {},
			resolvedLintRules: [],
		},
		errors: [],
	}

	for (const module of args.config.modules) {
		try {
			/**
			 * -------------- BEGIN SETUP --------------
			 */

			const importedModule = await tryCatch(() => args.env.$import(module))

			// -- IMPORT MODULE --
			if (importedModule.error) {
				result.errors.push(
					new ModuleImportError(`Couldn't import the plugin "${module}"`, {
						module,
						cause: importedModule.error as Error,
					}),
				)
			}

			const inlangModule = importedModule.data.default as InlangModule

			// --- GET PLUGIN & LINT RULES ---
			const plugins = inlangModule.default.plugins as Plugin[]
			const lintRules = inlangModule.default.lintRules as LintRule[]

			const resolvedPlugins = await resolvePlugins({
				plugins,
				pluginsInConfig,
				config: args.config,
				env: args.env,
			})

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

			result.data.resolvedPlugins = {
				...result.data.resolvedPlugins,
				...resolvedPlugins.data.plugins,
			}

			result.data.resolvedLintRules = {
				...result.data.resolvedLintRules,
				...lintRules,
			}
		} catch (e) {
			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof ModuleError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(
					new ModuleError(e.message, { module: module, cause: e }),
				)
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


