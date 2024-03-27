import { matches } from "./matching/match.js"
import { resolvePath } from "./matching/resolvePath.js"
import type { PathTranslations } from "../config/pathTranslations.js"

export function getTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathTranslations
) {
	const match = matches(canonicalPath, Object.keys(translations))
	if (!match) return canonicalPath

	const translationsForPath = translations[match.id as `/${string}`]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	return resolvePath(translatedPath, match.params)
}
