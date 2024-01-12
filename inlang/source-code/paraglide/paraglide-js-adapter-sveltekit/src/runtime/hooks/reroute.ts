import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "../path-translations/getCanonicalPath.js"
import type { Reroute } from "@sveltejs/kit"
import type { PathTranslations } from "../path-translations/types.js"
import type { Paraglide } from "../runtime.js"

/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const createReroute = (
	runtime: Paraglide<any>,
	translations: PathTranslations<string>
): Reroute => {
	return ({ url }) => {
		try {
			const {
				lang,
				path: translatedPath,
				isDataRequest,
			} = getPathInfo(url.pathname, {
				base,
				availableLanguageTags: runtime.availableLanguageTags,
				defaultLanguageTag: runtime.sourceLanguageTag,
			})

			const canonicalPath = getCanonicalPath(translatedPath, lang, translations)

			const serializedPath = serializeRoute({
				path: canonicalPath,
				base,
				isDataRequest,
				includeLanguage: false,
			})

			return serializedPath
		} catch (e) {
			console.error(e)
			return url.pathname
		}
	}
}
