import { getCanonicalPath } from "../translate-paths/get-canonical-path.js"
import { parsePath } from "../utils/parse-path.js"
import { base } from "$app/paths"
import { serializePath } from "../utils/serialize-path.js"
import type { Reroute } from "@sveltejs/kit"
import type { PathTranslations } from "../translate-paths/path-translations.js"
import type { Paraglide } from "../runtime.js"
/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const reroute = (
	runtime: Paraglide<any>,
	translations: PathTranslations<string>
): Reroute => {
	return ({ url }) => {
		try {
			const { lang, canonicalPath, isDataRequest } = parsePath(url.pathname, {
				base,
				availableLanguageTags: runtime.availableLanguageTags,
				defaultLanguageTag: runtime.sourceLanguageTag,
			})

			const resolvedPath = getCanonicalPath(canonicalPath, lang, translations)

			const serializedPath = serializePath({
				path: resolvedPath,
				lang,
				base,
				defaultLanguageTag: runtime.sourceLanguageTag,
				isDataRequest,
			})

			console.log("reroute", url.pathname, serializedPath)

			return serializedPath
		} catch (e) {
			console.error(e)
			return url.pathname
		}
	}
}
