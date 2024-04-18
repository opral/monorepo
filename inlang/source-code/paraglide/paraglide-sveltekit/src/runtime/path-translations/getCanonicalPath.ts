import {
	resolveRoute,
	bestMatch,
	type PathDefinitionTranslations,
} from "@inlang/paraglide-js/internal/adapter-utils"
import type { ParamMatcher } from "@sveltejs/kit"

/**
 * Resolves the canonical path from a translated path
 * @param translatedPath The translated path WITHOUT the language or base
 */
export function getCanonicalPath(
	translatedPath: string,
	lang: string,
	translations: PathDefinitionTranslations,
	matchers: Record<string, ParamMatcher>,
): string {
	for (const [canonicalPathDefinition, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue

		const translatedPathDefinition = translationsForPath[lang]
		if (!translatedPathDefinition) continue

		const match = bestMatch(translatedPath, [translatedPathDefinition], matchers)
		if (!match) continue

		return resolveRoute(canonicalPathDefinition, match.params)
	}

	return translatedPath
}
