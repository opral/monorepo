import { bestMatch } from "./matching/match.js"
import { resolve_route } from "./matching/routing.js"
import type { PathTranslations } from "../config/pathTranslations.js"
import type { ParamMatcher } from "@sveltejs/kit"

/**
 * Resolves the canonical path from a translated path
 * @param translatedPath The translated path WITHOUT the language or base
 */
export function getCanonicalPath(
	translatedPath: string,
	lang: string,
	translations: PathTranslations,
	matchers: Record<string, ParamMatcher>
): string {
	for (const [canonicalPathDefinition, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue

		const translatedPathDefinition = translationsForPath[lang]
		if (!translatedPathDefinition) continue

		const match = bestMatch(translatedPath, [translatedPathDefinition], matchers)
		if (!match) continue

		return resolve_route(canonicalPathDefinition, match.params)
	}

	return translatedPath
}
