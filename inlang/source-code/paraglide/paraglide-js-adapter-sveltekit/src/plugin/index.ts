import { paraglide as vitePluginParaglide } from "@inlang/paraglide-js-adapter-vite"
import type { Plugin } from "vite"
import { resolve } from "node:path"
import { OUTDIR_ALIAS, TRANSLATE_PATH_FUNCTION_NAME } from "../constants.js"

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
			if (!id.startsWith(OUTDIR_ALIAS)) return null
			return id.replace(OUTDIR_ALIAS, outdir)
		},
	}
}
