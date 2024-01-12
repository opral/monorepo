import { getTranslatedPath } from "./translate-paths/translate.js"
import { isExternal } from "./utils/external.js"
import { parsePath } from "./utils/parse-path.js"
import { base } from "$app/paths"
import type { Handle } from "@sveltejs/kit"
import type { Paraglide } from "./runtime.js"
import type { PathTranslations } from "./translate-paths/path-translations.js"

/**
 * This is a SvelteKit Server hook that rewrites redirects to internal pages to use the correct language.s
 */
export const handleRedirects: (
	runtime: Paraglide<any>,
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

		console.log("redirect", from.href, to.href)

		if (isExternal(to, from, base)) return response

		const { lang } = parsePath(from.pathname, {
			base,
			availableLanguageTags: runtime.availableLanguageTags,
			defaultLanguageTag: runtime.sourceLanguageTag,
		})

		const translatedPath = getTranslatedPath(to.pathname, lang, translations)

		console.log("translatedPath", translatedPath)

		response.headers.set("location", translatedPath)
		return response
	}

function isRedirect(response: Response) {
	return response.status >= 300 && response.status < 400
}
