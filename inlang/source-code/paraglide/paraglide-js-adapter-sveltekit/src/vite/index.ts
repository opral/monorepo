import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import { preprocessor, type PreprocessorConfig } from "./preprocessor/index.js"
import { type UserConfig, type Config, resolveConfig } from "./config.js"
import type { Plugin } from "vite"

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	const config = resolveConfig(userConfig)
	const plugins: Plugin[] = [vitePluginParaglide(config)]

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
			sveltePreprocess: preprocessor(preprocessConfig),
		},
	}
}
