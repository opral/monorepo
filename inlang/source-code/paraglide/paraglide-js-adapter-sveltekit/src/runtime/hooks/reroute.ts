import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "../path-translations/getCanonicalPath.js"
import type { Reroute } from "@sveltejs/kit"
import type { I18nConfig } from "../adapter.js"
import { dev } from "$app/environment"

/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const createReroute = <T extends string>({
	defaultLanguageTag,
	runtime,
	translations,
	matchers,
}: I18nConfig<T>): Reroute => {
	return ({ url }) => {
		try {
			const {
				lang,
				path: translatedPath,
				dataSuffix,
				trailingSlash,
			} = getPathInfo(url.pathname, {
				base,
				availableLanguageTags: runtime.availableLanguageTags,
				defaultLanguageTag,
			})

			const canonicalPath = getCanonicalPath(translatedPath, lang, translations, matchers)

			const serializedPath = serializeRoute({
				path: canonicalPath,
				base,
				dataSuffix,
				trailingSlash,
				includeLanguage: false,
			})

			return serializedPath
		} catch (e) {
			if (dev) {
				console.error("[@inlang/paraglide-js-adapter-sveltekit] Error thrown during reroute", e)
			}
			return url.pathname
		}
	}
}
