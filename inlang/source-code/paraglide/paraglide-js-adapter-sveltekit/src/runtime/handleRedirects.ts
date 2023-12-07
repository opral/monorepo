import getLanguage from "$paraglide-adapter-sveltekit:get-language"
import type { Handle } from "@sveltejs/kit"
import { getLanguageFromURL } from "./getLanguageFromUrl.js"
import { sourceLanguageTag } from "$paraglide-adapter-sveltekit:runtime"
import translatePath from "$paraglide-adapter-sveltekit:translate-path"

function isRedirect(response: Response) {
	return response.status >= 300 && response.status < 400
}

/**
 * This is a SvelteKit Server hook that rewrites redirects to internal pages to use the correct language.s
 * @param param0
 * @returns
 */
export const handleRedirects: () => Handle =
	() =>
	async ({ event, resolve }) => {
		const response = await resolve(event)
		if (!isRedirect(response)) return response

		//If the redirect is to an internal page, we need to rewrite the url to include the language
		const location = response.headers.get("location")
		if (!location || !location.startsWith("/")) return response

		const language = getLanguageFromURL(event.url) ?? sourceLanguageTag
		const newLocation = translatePath(location, language)

		console.log("newLocation", newLocation)

		response.headers.set("location", newLocation)
		return response
	}
