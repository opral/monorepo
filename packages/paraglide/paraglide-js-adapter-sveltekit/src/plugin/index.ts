import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import {
	GET_LANGUAGE_MODULE_ID,
	PARAGLIDE_RUNTIME_ALIAS,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import type { RoutingStrategyConfig } from "./routing/strategy.js"
import { getTranslatePathModuleCode } from "./routing/translatePath.js"
import { preprocess, type PreprocessorConfig } from "../preprocessor/index.js"
import { getGetLanguageModuleCode } from "./routing/getLanguage.js"

type VitePluginUserConfig = Parameters<typeof vitePluginParaglide>[0]

interface UserConfig extends VitePluginUserConfig {
	/**
	 * The configuration for i18n routing.
	 */
	i18n?: {
		/**
		 * The routing strategy to use.
		 * @default { name: "prefix", prefixDefault: false }
		 */
		strategy?: RoutingStrategyConfig

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
}

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	const plugins: Plugin[] = [vitePluginParaglide(userConfig), adapterSvelteKit(userConfig)]

	if (userConfig.i18n?.disablePreprocessor !== true) {
		plugins.push(registerPreprocessor(userConfig))
	}

	return plugins
}

/**
 * This plugin registers the preprocessor with Svelte.
 */
function registerPreprocessor(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_userConfig: UserConfig
): Plugin {
	const preprocessConfig: PreprocessorConfig = {}
	return {
		name: "paraglide-js-adapter-sveltekit-register-preprocessor",
		api: {
			//The Svelte vite-plugin looks for this and automatically adds it to the preprocess array
			sveltePreprocess: preprocess(preprocessConfig),
		},
	}
}

/**
 * Makes the necessary virtual modules available.
 */
function adapterSvelteKit(userConfig: UserConfig): Plugin {
	const outdir = resolve(process.cwd(), userConfig.outdir)
	const strategy = userConfig.i18n?.strategy ?? { name: "prefix", prefixDefault: false }

	const excludeRegexes = userConfig.i18n?.exclude ?? []

	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		resolveId(id) {
			if (id === TRANSLATE_PATH_MODULE_ID) {
				const resolved = "\0" + TRANSLATE_PATH_MODULE_ID
				return resolved
			}

			if (id === GET_LANGUAGE_MODULE_ID) {
				const resolved = "\0" + GET_LANGUAGE_MODULE_ID
				return resolved
			}

			if (id === PARAGLIDE_RUNTIME_ALIAS) {
				return resolve(outdir, "runtime.js")
			}

			return undefined
		},

		load(id) {
			if (id === "\0" + TRANSLATE_PATH_MODULE_ID) {
				return getTranslatePathModuleCode(strategy, excludeRegexes)
			}

			if (id === "\0" + GET_LANGUAGE_MODULE_ID) {
				return getGetLanguageModuleCode(strategy)
			}

			return undefined
		},
	}
}
