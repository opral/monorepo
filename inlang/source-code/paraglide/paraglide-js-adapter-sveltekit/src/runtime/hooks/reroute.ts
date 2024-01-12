import { parsePath } from "../utils/parse-path.js"
import { base } from "$app/paths"
import { serializeRoute } from "../utils/serialize-path.js"
import type { Reroute } from "@sveltejs/kit"
import type { PathTranslations } from "../translate-paths/path-translations.js"
import type { Paraglide } from "../runtime.js"
import { resolveTranslatedPath } from "../translate-paths/resolve-translated-path.js"
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

			const resolvedPath = resolveTranslatedPath(canonicalPath, lang, translations)

			const serializedPath = serializeRoute({
				path: resolvedPath,
				base,
				isDataRequest,
			})

			return serializedPath
		} catch (e) {
			console.error(e)
			return url.pathname
		}
	}
}
