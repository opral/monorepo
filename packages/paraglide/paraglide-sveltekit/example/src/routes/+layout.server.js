export const prerender = true
export const trailingSlash = "always"

/**
 * @type { import("./$types").LayoutServerLoad}
 */
export function load({ locals, depends }) {
	// This tells SvelteKit to re-run this load function when the language changes
	depends("paraglide:lang")

	return {
		serverLang: `The language on the server is ${locals.paraglide.lang}`,
	}
}