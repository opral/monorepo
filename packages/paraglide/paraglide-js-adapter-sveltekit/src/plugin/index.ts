import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import {
	GET_LANGUAGE_MODULE_ID,
	PARAGLIDE_RUNTIME_MODULE_ALIAS,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import { getTranslatePathModuleCode } from "./routing/translatePath.js"
import { preprocess, type PreprocessorConfig } from "../preprocessor/index.js"
import { getGetLanguageModuleCode } from "./routing/getLanguage.js"
import { type UserConfig, type Config, resolveConfig } from "./config.js"

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	const config = resolveConfig(userConfig)
	const plugins: Plugin[] = [vitePluginParaglide(config), adapterSvelteKit(config)]

	if (!config.disablePreprocessor) {
		plugins.push(registerPreprocessor(config))
	}

	return plugins
}

/**
 * This plugin registers the preprocessor with Svelte.
 */
function registerPreprocessor(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_config: Config
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
function adapterSvelteKit(config: Config): Plugin {
	const outdir = resolve(process.cwd(), config.outdir)

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

			if (id === PARAGLIDE_RUNTIME_MODULE_ALIAS) {
				return resolve(outdir, "runtime.js")
			}

			return undefined
		},

		load(id) {
			if (id === "\0" + TRANSLATE_PATH_MODULE_ID) {
				return getTranslatePathModuleCode(config.routingStrategy, config.exclude)
			}

			if (id === "\0" + GET_LANGUAGE_MODULE_ID) {
				return getGetLanguageModuleCode(config.routingStrategy)
			}

			return undefined
		},
	}
}
