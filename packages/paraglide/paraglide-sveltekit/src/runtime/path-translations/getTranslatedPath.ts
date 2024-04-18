import {
	resolveRoute,
	bestMatch,
	type PathDefinitionTranslations,
} from "@inlang/paraglide-js/internal/adapter-utils"
import type { ParamMatcher } from "@sveltejs/kit"

export function getTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>,
) {
	const match = bestMatch(canonicalPath, Object.keys(translations), matchers)
	if (!match) return canonicalPath

	const translationsForPath = translations[match.id as `/${string}`]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	return resolveRoute(translatedPath, match.params)
}
