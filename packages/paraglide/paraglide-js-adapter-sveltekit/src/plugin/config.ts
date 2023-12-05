import type { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { RoutingStrategyConfig } from "./routing/strategy.js"

type VitePluginUserConfig = Parameters<typeof vitePluginParaglide>[0]

export interface UserConfig extends VitePluginUserConfig {
	/**
	 * The routing strategy to use.
	 * The avaliable strategies are:
	 * - domain
	 * - prefix
	 * - searchParam
	 *
	 * @default { name: "prefix", prefixDefault: false }
	 */
	routingStrategy?: RoutingStrategyConfig

	/**
	 * The preprocessor rewrites any links in your markup
	 * and translates them according to the routing strategy.
	 *
	 * If you don't want this, you can disable it here.
	 *
	 * @default false
	 */
	disablePreprocessor?: boolean

	/**
	 * An array of regexes for paths that should not be translated.
	 * @default []
	 *
	 * @example
	 * ```ts
	 * //Don't translate any paths starting with /not-translated or /api
	 * exclude: [new RegExp("^/not-translated"), new RegExp("^/api")]
	 * ```
	 */
	exclude?: RegExp[]
}

/**
 * The full config for paraglide-js-adapter-sveltekit.
 * Any values not provided by the user are filled in with defaults.
 */
export interface Config extends VitePluginUserConfig {
	routingStrategy: RoutingStrategyConfig
	disablePreprocessor: boolean
	exclude: RegExp[]
}

/**
 * Takes in the config provided by the user and returns the full config used internally.
 * All values not provided by the user are filled in with defaults.
 *
 * @param userConfig The user config
 * @returns The internal full config
 */
export function resolveConfig(userConfig: UserConfig): Config {
	const fullConfig: Config = {
		project: userConfig.project,
		outdir: userConfig.outdir,
		silent: userConfig.silent,

		routingStrategy: userConfig.routingStrategy ?? { name: "prefix", prefixDefault: false },
		disablePreprocessor: userConfig.disablePreprocessor ?? false,
		exclude: userConfig.exclude ?? [],
	}

	return fullConfig
}
