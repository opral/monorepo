import { getPathInfo } from "../utils/get-path-info.js"
import type { NormalizedBase } from "../utils/normaliseBase.js"
import { serializeRoute } from "../utils/serialize-path.js"
import { getCanonicalPath } from "./getCanonicalPath.js"
import { getTranslatedPath } from "./getTranslatedPath.js"
import { type PathDefinitionTranslations } from "@inlang/paraglide-js/internal/adapter-utils"
import type { ParamMatcher } from "@sveltejs/kit"

/**
 * Utility function to translate a path in one language to another language
 */
export function translatePath(
	path: string,
	targetLanguage: string,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>,
	opts: {
		normalizedBase: NormalizedBase
		availableLanguageTags: readonly string[]
		defaultLanguageTag: string
		prefixDefaultLanguage: "always" | "never"
	}
) {
	const {
		path: targetedPathSource,
		languageTag: langInPath,
		dataSuffix,
		trailingSlash,
	} = getPathInfo(path, {
		normalizedBase: opts.normalizedBase,
		availableLanguageTags: opts.availableLanguageTags,
	})

	const lang = langInPath || opts.defaultLanguageTag

	const canonicalPath = getCanonicalPath(targetedPathSource, lang, translations, matchers)
	const translatedPathTarget = getTranslatedPath(
		canonicalPath,
		targetLanguage,
		translations,
		matchers
	)

	return serializeRoute({
		path: translatedPathTarget,
		base: opts.normalizedBase,
		dataSuffix,
		includeLanguage: true,
		lang: targetLanguage,
		defaultLanguageTag: opts.defaultLanguageTag,
		prefixDefaultLanguage: opts.prefixDefaultLanguage,
		trailingSlash,
	})
}
