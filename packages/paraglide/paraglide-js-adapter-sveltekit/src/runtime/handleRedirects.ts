import type { Handle } from "@sveltejs/kit"
import type { Paraglide } from "./runtime.js"

/**
 * This is a SvelteKit Server hook that rewrites redirects to internal pages to use the correct language.s
 * @param param0
 * @returns
 */
export const handleRedirects: (runtime: Paraglide<string>) => Handle =
	(runtime) =>
	async ({ event, resolve }) => {
		const response = await resolve(event)
		if (!isRedirect(response)) return response

		//If the redirect is to an internal page, we need to rewrite the url to include the language
		const location = response.headers.get("location")
		if (!location || !location.startsWith("/")) return response

		const language = getLanguageFromURL(event.url) ?? runtime.sourceLanguageTag
		const newLocation = translatePath(location, language)

		response.headers.set("location", newLocation)
		return response
	}

function getLanguageFromURL(url: URL) {
	const match = url.pathname.match(/^\/([a-z]{2})\//)
	return match?.[1]
}

function translatePath(path: string, language: string) {
	return path.replace(/^\/([a-z]{2})\//, `/${language}/`)
}

function isRedirect(response: Response) {
	return response.status >= 300 && response.status < 400
}
