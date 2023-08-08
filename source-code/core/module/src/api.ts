import type { InlangConfig } from "@inlang/config"
import type { LintRule } from "@inlang/lint"
import type { NodeishFilesystemSubset, Plugin, ResolvePluginsFunction } from "@inlang/plugin"
import type { ModuleError, ModuleImportError } from "./errors.js"
import type { ImportFunction } from "./import.js"

/**
 * The inlang module API.
 *
 * An inlang module exports a default object with the following properties:
 *
 * - `plugins`: An array of plugins.
 * - `lintRules`: An array of lint rules.
 *
 * @example
 *   export default {
 *     plugins: [plugin1, plugin2],
 *     lintRules: [lintRule1, lintRule2],
 *   }
 */

export type InlangModule = {
	default: {
		plugins?: Plugin<any>[]
		lintRules?: LintRule[]
	}
}

/**
 * Function that resolves modules from the config.
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolveModulesFunction = (args: {
	config: InlangConfig
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}) => Promise<{
	data: {
		meta: {
			plugins: Array<Plugin["meta"] & { module: string }>
			lintRules: Array<LintRule["meta"] & { module: string }>
		}
		plugins: {
			data: Awaited<ReturnType<ResolvePluginsFunction>>["data"]
			errors: Awaited<ReturnType<ResolvePluginsFunction>>["errors"]
		}
		lintRules: {
			data: Array<LintRule>
			errors: Array<Error>
		}
	}
	errors: Array<ModuleError | ModuleImportError>
}>
