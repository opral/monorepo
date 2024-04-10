import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "../path-translations/getCanonicalPath.js"
import { browser, dev } from "$app/environment"
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
	matchers,
}: I18nConfig<T>): Reroute => {
	return ({ url }) => {
		if (browser) {
			runtime.setLanguageTag(() => {
				if (!url.pathname.startsWith(base)) {
					console.warn(
						`${url.pathname} does not start with ${base}, using default language tag ${defaultLanguageTag}`
					)
					return defaultLanguageTag
				}

				const pathWithLanguage = url.pathname.slice(base.length)
				const lang = pathWithLanguage.split("/").at(1)

				if (runtime.isAvailableLanguageTag(lang)) return lang
				return defaultLanguageTag
			})
		}

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
