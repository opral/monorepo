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
	matchers: Record<string, ParamMatcher>
) {
	function getLanguageFromLocalisedPath(localisedPath: string): T {
		const segments = localisedPath.split("/")
		const maybeLang = segments[1]
		if (availableLanguageTags.includes(maybeLang as any) && maybeLang !== defaultLanguageTag) {
			return maybeLang as T
		}
		return defaultLanguageTag
	}

	function getLocalisedPath(canonicalPath: string, languageTag: T): string {
		const trailingSlash = canonicalPath.endsWith("/")
		canonicalPath = trailingSlash ? canonicalPath.slice(0, -1) : canonicalPath

		//if it's not the default language, remove it from the URL
		if (languageTag !== defaultLanguageTag) {
			canonicalPath = canonicalPath.replace(`/${languageTag}`, "")
		}

		// TODO find the best match
		let translatedPath = turnIntoTranslatedPath(canonicalPath, languageTag, translations, matchers)

		if (trailingSlash) {
			translatedPath = `${translatedPath}/`
		}

		if (languageTag !== defaultLanguageTag) {
			translatedPath = `${languageTag}/${translatedPath}`
		}

		return translatedPath
	}

	function getCanonicalPath(localisedPath: string, languageTag: T): string {
		const trailingSlash = localisedPath.endsWith("/")
		localisedPath = trailingSlash ? localisedPath.slice(0, -1) : localisedPath

		let canonicalPath = turnIntoCanonicalPath(localisedPath, languageTag, translations, matchers)

		if (trailingSlash) {
			canonicalPath = `${canonicalPath}/`
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
