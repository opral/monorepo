import type { PathTranslations } from "./path-translations.js"

/**
 * Resolves the canonical path from a translated path
 * @param translatedPath The translated path WITHOUT the language or base
 */
export function resolveTranslatedPath(
	translatedPath: string,
	lang: string,
	translations: PathTranslations<string>
): string {
	for (const [canonicalPath, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue
		if (translationsForPath[lang] === translatedPath) {
			return canonicalPath
		}
	}

	return translatedPath
}
