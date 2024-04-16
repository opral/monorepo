import { getTranslatedPath } from "../path-translations/getTranslatedPath.js"
import { isExternal } from "../utils/external.js"
import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import type { Handle, ParamMatcher } from "@sveltejs/kit"
import type { Paraglide } from "../runtime.js"
import type { PathTranslations } from "../config/pathTranslations.js"

/**
 * This is a SvelteKit Server hook that rewrites redirects to internal pages to use the correct language.s
 */
export const handleRedirects: (
	runtime: Paraglide<any>,
	translations: PathTranslations<string>,
	matchers: Record<string, ParamMatcher>
) => Handle =
	(runtime, translations, matchers) =>
	async ({ event, resolve }) => {
		const response = await resolve(event)
		if (!isRedirect(response)) return response

		//If the redirect is to an internal page, we need to rewrite the url to include the language
		const location = response.headers.get("location")
		if (!location) return response

		const from = new URL(event.url)
		const to = new URL(location, from)

		if (isExternal(to, from, base)) return response

		const { lang } = getPathInfo(from.pathname, {
			base,
			availableLanguageTags: runtime.availableLanguageTags,
			defaultLanguageTag: runtime.sourceLanguageTag,
		})

		const translatedPath = getTranslatedPath(to.pathname, lang, translations, matchers)

		response.headers.set("location", translatedPath)
		return response
	}

function isRedirect(response: Response) {
	return response.status >= 300 && response.status < 400
}
