import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import { HEADER_COMPONENT_MODULE_ID, OUTDIR_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../constants.js"
import { preprocess } from "../index.js"
import { getTranslatePathModuleCode, type RoutingStrategyConfig } from "./translatePath.js"
import { getHeaderComponentCode } from "./header.js"

type VitePluginUserConfig = Parameters<typeof vitePluginParaglide>[0]

interface UserConfig extends VitePluginUserConfig {
	strategy?: RoutingStrategyConfig
}

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	return [vitePluginParaglide(userConfig), adapterSvelteKit(userConfig)]
}

function adapterSvelteKit(userConfig: UserConfig): Plugin {
	const outdir = resolve(process.cwd(), userConfig.outdir)
	const strategy = userConfig.strategy ?? { name: "prefix", prefixDefault: false }

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
				return getTranslatePathModuleCode(strategy)
			}

			if (id === HEADER_COMPONENT_MODULE_ID) {
				return getHeaderComponentCode()
			}

			return null
		},
		api: {
			//The Svelte vite-plugin looks for this and automatically adds it to the preprocess array
			sveltePreprocess: preprocess(),
		},
	}
}
