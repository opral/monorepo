import { matches } from "./matching/match.js"
import { resolvePath } from "./matching/resolvePath.js"
import type { PathTranslations } from "../config/pathTranslations.js"

/**
 * Resolves the canonical path from a translated path
 * @param translatedPath The translated path WITHOUT the language or base
 */
export function getCanonicalPath(
	translatedPath: string,
	lang: string,
	translations: PathTranslations
): string {
	for (const [canonicalPathDefinition, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue

		const translatedPathDefinition = translationsForPath[lang]
		if (!translatedPathDefinition) continue

		const match = matches(translatedPath, [translatedPathDefinition])
		if (!match) continue

		return resolvePath(canonicalPathDefinition, match.params)
	}

	return translatedPath
}
