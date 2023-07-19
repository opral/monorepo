import type * as ast from "../ast/index.js"
import type { InlangEnvironment } from "../environment/types.js"
import type { LintRule } from "../lint/rule.js"
import type { Plugin, PluginSetupFunction } from "../plugin/types.js"
import type { IdeExtensionConfigSchema } from "./ideExtension/schema.js"
import type { LanguageTag } from "../languageTag/index.js"

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
	sourceLanguageTag: LanguageTag
	/**
	 * Available language tags in this project.
	 */
	languageTags: LanguageTag[]

	// TODO: should be defined in plugin api? https://github.com/inlang/inlang/issues/1140
	loadMessages: (args: { config: InlangConfig }) => Promise<ast.Message[]>
	// TODO: should be defined in plugin api? https://github.com/inlang/inlang/issues/1140
	saveMessages: (args: { config: InlangConfig; messages: ast.Message[] }) => Promise<void>

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
	// TODO should be defined in plugin api? https://github.com/inlang/inlang/issues/1140
	ideExtension?: IdeExtensionConfigSchema
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
