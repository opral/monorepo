import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import { HEADER_COMPONENT_MODULE_ID, OUTDIR_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../constants.js"
import { getTranslatePathModuleCode, type RoutingStrategyConfig } from "./translatePath.js"
import { getHeaderComponentCode } from "./header.js"
import { preprocess, type PreprocessorConfig } from "../preprocessor/index.js"

type VitePluginUserConfig = Parameters<typeof vitePluginParaglide>[0]

interface UserConfig extends VitePluginUserConfig {
	strategy?: RoutingStrategyConfig

	/**
	 * If the preprocessor should be disabled.
	 * @default false
	 */
	disablePreprocessor?: boolean

	//The below regex has a zero-width space between the * and the /
	/**
	 * An array of regexes for paths that should not be translated.
	 * @default []
	 */
	exclude?: RegExp[]
}

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	const plugins: Plugin[] = [vitePluginParaglide(userConfig), adapterSvelteKit(userConfig)]

	if (userConfig.disablePreprocessor !== true) {
		plugins.push(registerPreprocessor(userConfig))
	}

	return plugins
}

/**
 * This plugin registers the preprocessor with Svelte.
 */
function registerPreprocessor(userConfig: UserConfig): Plugin {
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
	const strategy = userConfig.strategy ?? { name: "prefix", prefixDefault: false }

	const excludeRegexes = userConfig.exclude ?? []

	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		resolveId(id) {
			if (id === TRANSLATE_PATH_MODULE_ID) {
				const resolved = "\0" + TRANSLATE_PATH_MODULE_ID
				return resolved
			}

			if (id === HEADER_COMPONENT_MODULE_ID) {
				const resolved = HEADER_COMPONENT_MODULE_ID
				return resolved
			}

			if (id.startsWith(OUTDIR_ALIAS)) {
				return id.replace(OUTDIR_ALIAS, outdir)
			}

			return null
		},

		load(id) {
			if (id === "\0" + TRANSLATE_PATH_MODULE_ID) {
				return getTranslatePathModuleCode(strategy, excludeRegexes)
			}

			if (id === HEADER_COMPONENT_MODULE_ID) {
				return getHeaderComponentCode(excludeRegexes)
			}

			return null
		},
	}
}