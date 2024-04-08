import { bestMatch } from "./matching/match.js"
import { resolve_route } from "./matching/routing.js"
import type { PathTranslations } from "../config/pathTranslations.js"

export function getTranslatedPath(canonicalPath: string, lang: string, translations: PathTranslations) {
	const match = bestMatch(canonicalPath, Object.keys(translations))
	if (!match) return canonicalPath

	const translationsForPath = translations[match.id as `/${string}`]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	return resolve_route(translatedPath, match.params)
}
