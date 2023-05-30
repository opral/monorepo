import type { Language } from "../ast/index.js"
import type * as ast from "../ast/index.js"
import type { InlangEnvironment } from "../environment/types.js"
import type { LintRule } from "../lint/rule.js"
import type { Plugin, PluginSetupFunction } from "../plugin/types.js"
import type { IdeExtensionConfigSchema } from "./ideExtension/schema.js"

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
	 * The reference language that other messages are validated against.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 * In most cases, the reference language is `en-US` (American English).
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	referenceLanguage: Language
	/**
	 * Available languages in this project.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	languages: Language[]
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
