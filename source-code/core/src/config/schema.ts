import type * as ast from "../ast/index.js"
import type { InlangEnvironment } from "../environment/types.js"
import type { LintRule } from "../lint/rule.js"
import type { Plugin, PluginSetupFunction } from "../plugin/types.js"
import type { IdeExtensionConfigSchema } from "./ideExtension/schema.js"
import type { BCP47LanguageTag } from "../languageTag/index.js"

/**
 * The entrypoint for inlang.
 *
 * Read more https://inlang.com/documentation/config
 */
export type DefineConfig = (
	env: InlangEnvironment,
) => Promise<InlangConfig | WithRequired<Partial<InlangConfig>, "plugins">>

/**
 * The inlang config module.
 *
 * Use this type to cast an import of an "inlang.config.js" file.
 *
 * @example
 * 	import type { ConfigModule } from "@inlang/core/config"
 *
 * 	const module = (await import("./inlang.config.js")) as InlangConfigModule
 */
export type InlangConfigModule = {
	defineConfig: DefineConfig
}

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type InlangConfig = {
	/**
	 * The source language tag in this project.
	 */
	sourceLanguageTag: BCP47LanguageTag
	/**
	 * Available language tags in this project.
	 */
	languageTags: BCP47LanguageTag[]
	readResources: (args: { config: InlangConfig }) => Promise<ast.Resource[]>
	writeResources: (args: { config: InlangConfig; resources: ast.Resource[] }) => Promise<void>

	/**
	 * Plugins to extend the functionality of inlang.
	 *
	 * @example
	 *  plugins: [
	 * 	 	myPlugin({
	 * 	   	pathPattern: "hello",
	 * 	 	})
	 *  ]
	 */
	plugins?: Array<Plugin | PluginSetupFunction>

	lint?: {
		rules: (LintRule | LintRule[])[]
	}

	/**
	 * The config schema for the ide extension.
	 */
	ideExtension?: IdeExtensionConfigSchema

	/**
	 * WARNING: Experimental properties are not required,
	 * can change at any time and do not lead to a MAJOR version bump.
	 *
	 * Read more under https://inlang.com/documentation/breaking-changes
	 */
	experimental?: Record<string, unknown>
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
