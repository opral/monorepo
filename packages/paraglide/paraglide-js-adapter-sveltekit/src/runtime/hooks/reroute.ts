import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "../path-translations/getCanonicalPath.js"
import type { Reroute } from "@sveltejs/kit"
import type { I18nConfig } from "../adapter.js"

/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const createReroute = <T extends string>({
	defaultLanguageTag,
	runtime,
	translations,
}: I18nConfig<T>): Reroute => {
	return ({ url }) => {
		try {
			const {
				lang,
				path: translatedPath,
				dataSuffix,
			} = getPathInfo(url.pathname, {
				base,
				availableLanguageTags: runtime.availableLanguageTags,
				defaultLanguageTag,
			})

			const canonicalPath = getCanonicalPath(translatedPath, lang, translations)

			const serializedPath = serializeRoute({
				path: canonicalPath,
				base,
				dataSuffix,
				includeLanguage: false,
			})

			console.log("rerouting", url.pathname, "to", serializedPath, "canonical", canonicalPath)

			return serializedPath
		} catch (e) {
			console.error(e)
			return url.pathname
		}
	}
}
