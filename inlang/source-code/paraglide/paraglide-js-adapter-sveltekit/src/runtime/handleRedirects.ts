import type { Handle } from "@sveltejs/kit"
import type { Paraglide } from "./runtime.js"
import type { PathTranslations } from "./translate-paths/path-translations.js"
import { getTranslatedPath } from "./translate-paths/translate.js"
import { isExternal } from "./utils/external.js"
import { base } from "$app/paths"

/**
 * This is a SvelteKit Server hook that rewrites redirects to internal pages to use the correct language.s
 * @param param0
 * @returns
 */
export const handleRedirects: (
	runtime: Paraglide<string>,
	translations: PathTranslations<string>
) => Handle =
	(runtime, translations) =>
	async ({ event, resolve }) => {
		const response = await resolve(event)
		if (!isRedirect(response)) return response

		//If the redirect is to an internal page, we need to rewrite the url to include the language
		const location = response.headers.get("location")
		if (!location) return response

		const from = new URL(event.url)
		const to = new URL(location, from)

		if (isExternal(to, from, base)) return response

		//TODO Determin based on the URL
		const lang = runtime.sourceLanguageTag

		const translatedPath = getTranslatedPath(to.pathname, lang, translations)
		response.headers.set("location", translatedPath)
		return response
	}

function isRedirect(response: Response) {
	return response.status >= 300 && response.status < 400
}
