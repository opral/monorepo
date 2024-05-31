import {
	bestMatch,
	resolveRoute,
	type PathDefinitionTranslations,
} from "@inlang/paraglide-js/internal/adapter-utils"
import type { ParamMatcher } from "@sveltejs/kit"

export type RoutingStrategy<T extends string> = ReturnType<typeof PrefixStrategy<T>>

export function PrefixStrategy<T extends string>(
	availableLanguageTags: readonly T[],
	defaultLanguageTag: T,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>,
	prefixDefaultLanguage: "always" | "never"
) {
	function getLanguageFromLocalisedPath(localisedPath: string): T | undefined {
		const segments = localisedPath.split("/")
		const maybeLang = segments[1]
		if (
			availableLanguageTags.includes(maybeLang as any) &&
			(prefixDefaultLanguage === "always" || maybeLang !== defaultLanguageTag)
		) {
			return maybeLang as T
		}

		if (prefixDefaultLanguage === "never") return defaultLanguageTag
		else return undefined
	}

	function getLocalisedPath(canonicalPath: string, languageTag: T): string {
		const trailingSlash = canonicalPath.endsWith("/") && canonicalPath !== "/"
		canonicalPath = trailingSlash ? canonicalPath.slice(0, -1) : canonicalPath

		let translatedPath = turnIntoTranslatedPath(canonicalPath, languageTag, translations, matchers)

		if (trailingSlash) {
			translatedPath += "/"
		}

		if (prefixDefaultLanguage === "always" || languageTag !== defaultLanguageTag) {
			translatedPath = `/${languageTag}${translatedPath}`
		}

		return translatedPath
	}

	function getCanonicalPath(localisedPath: string, languageTag: T): string {
		const trailingSlahsBefore = localisedPath.endsWith("/") && localisedPath !== "/"
		if (prefixDefaultLanguage === "always" || languageTag !== defaultLanguageTag) {
			localisedPath = localisedPath.replace(`/${languageTag}`, "") || "/"
		}

		const trailingSlash = trailingSlahsBefore
		localisedPath = trailingSlash ? localisedPath.slice(0, -1) : localisedPath

		let canonicalPath = turnIntoCanonicalPath(localisedPath, languageTag, translations, matchers)

		if (trailingSlash) {
			canonicalPath += "/"
		}

		return canonicalPath
	}

	return {
		getLanguageFromLocalisedPath,
		getLocalisedPath,
		getCanonicalPath,
	}
}

/**
 * Resolves the canonical path from a translated path
 * @param translatedPath The translated path WITHOUT the language or base
 */
function turnIntoCanonicalPath(
	translatedPath: string,
	lang: string,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>
): string {
	for (const [canonicalPathDefinition, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue

		const translatedPathDefinition = translationsForPath[lang]
		if (!translatedPathDefinition) continue

		const match = bestMatch(translatedPath, [translatedPathDefinition], matchers)
		if (!match) continue

		// return the resolved canonical path
		return resolveRoute(canonicalPathDefinition, match.params)
	}

	// fall back to translated path if no canonical path is found
	return translatedPath
}

function turnIntoTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>
) {
	const match = bestMatch(canonicalPath, Object.keys(translations), matchers)
	if (!match) return canonicalPath

	const translationsForPath = translations[match.id as `/${string}`]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	// return the translated path
	return resolveRoute(translatedPath, match.params)
}
