import { getPathInfo } from "../utils/get-path-info.js"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "./getCanonicalPath.js"
import { getTranslatedPath } from "./getTranslatedPath.js"
import type { PathTranslations } from "../config/pathTranslations.js"
import type { ParamMatcher } from "@sveltejs/kit"

/**
 * Utility function to translate a path in one language to another language
 */
export function translatePath(
	path: string,
	targetLanguage: string,
	translations: PathTranslations,
	matchers: Record<string, ParamMatcher>,
	opts: {
		base: string
		availableLanguageTags: readonly string[]
		defaultLanguageTag: string
		prefixDefaultLanguage: "always" | "never"
	}
) {
	const {
		path: targetedPathSource,
		lang,
		dataSuffix,
		trailingSlash,
	} = getPathInfo(path, {
		base: opts.base,
		availableLanguageTags: opts.availableLanguageTags,
		defaultLanguageTag: opts.defaultLanguageTag,
	})

	const canonicalPath = getCanonicalPath(targetedPathSource, lang, translations, matchers)
	const translatedPathTarget = getTranslatedPath(
		canonicalPath,
		targetLanguage,
		translations,
		matchers
	)

	return serializeRoute({
		path: translatedPathTarget,
		base: opts.base,
		dataSuffix,
		includeLanguage: true,
		lang: targetLanguage,
		defaultLanguageTag: opts.defaultLanguageTag,
		prefixDefaultLanguage: opts.prefixDefaultLanguage,
		trailingSlash,
	})
}
