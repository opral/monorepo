export const prerender = true

let i = 0

/**
 * @type { import("./$types").LayoutServerLoad}
 */
export function load({ locals, depends }) {
	depends("paraglide:lang")
	console.log("Server layout load", i++)

	return {
		serverLang: `The language on the server is ${locals.paraglide.lang}`,
	}
}