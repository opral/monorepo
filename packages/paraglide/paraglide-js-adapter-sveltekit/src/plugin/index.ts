import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import {
	HEADER_COMPONENT_MODULE_ID,
	OUTDIR_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import { preprocess } from "../index.js"
import dedent from "dedent"
import { getTranslatePathModuleCode } from "./translatePath.js"

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
				return getTranslatePathModuleCode()
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

function getHeaderComponentCode(): string {
	return dedent`
		<script>
			import { availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"
			import { ${TRANSLATE_PATH_FUNCTION_NAME} } from "${TRANSLATE_PATH_MODULE_ID}"
			import { page } from "$app/stores"
		</script>

		<svelte:head>
			{#each availableLanguageTags as lang}
				<link rel="alternate" hreflang={lang} href={${TRANSLATE_PATH_FUNCTION_NAME}($page.url.pathname, lang)} />
			{/each}
		</svelte:head>
	`
}
