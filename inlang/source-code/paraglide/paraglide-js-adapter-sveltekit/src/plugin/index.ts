import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import {
	OUTDIR_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import { preprocess } from "../index.js"

type UserConfig = Parameters<typeof vitePluginParaglide>[0]

// Vite's Plugin type is often incompatible between vite versions, so we use any here
export function paraglide(userConfig: UserConfig): any {
	return [vitePluginParaglide(userConfig), adapterSvelteKit(userConfig)]
}

function adapterSvelteKit(userConfig: UserConfig): Plugin {
	const outdir = resolve(process.cwd(), userConfig.outdir)

	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		resolveId(id) {
			if (id === TRANSLATE_PATH_MODULE_ID) return id

			if (!id.startsWith(OUTDIR_ALIAS)) return null
			return id.replace(OUTDIR_ALIAS, outdir)
		},

		load(id) {
			if (id !== TRANSLATE_PATH_MODULE_ID) return null
			return `
				import { sourceLanguageTag } from "${OUTDIR_ALIAS}/runtime.js"

				/**
				 * Takes in a path without language information and
				 * returns a path with language information.
				 * 
				 * @param {string} path
				 * @param {string} lang
				 * @returns {string}
				 */
				export function ${TRANSLATE_PATH_FUNCTION_NAME}(path, lang) {
					// ignore external links & relative paths
					if (!path.startsWith("/")) return path 

					//Don't prefix with the source language tag, that's the default
					if (lang === sourceLanguageTag) return path

					//Otherwise, prefix with the language tag
					else return "/" + lang + path
				}
			`
		},

		api: {
			//The Svelte vite-plugin looks for this and automatically adds it to the preprocess array
			sveltePreprocess: preprocess(),
		},
	}
}
