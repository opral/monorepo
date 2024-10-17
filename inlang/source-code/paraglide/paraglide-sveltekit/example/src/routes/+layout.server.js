import { languageTag } from "$lib/paraglide/runtime"

export const prerender = true
export const trailingSlash = "always"

/**
 * @type { import("./$types").LayoutServerLoad}
 */
export function load({ depends }) {
	// This tells SvelteKit to re-run this load function when the language changes
	depends("paraglide_lang")

	return {
		serverLang: `The language on the server is ${languageTag()}`,
	}
}
