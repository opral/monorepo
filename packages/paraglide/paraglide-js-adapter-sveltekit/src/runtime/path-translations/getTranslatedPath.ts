import { matches } from "./matching/match.js"
import { resolvePath } from "./matching/resolvePath.js"
import type { PathTranslations } from "./types.js"

export function getTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathTranslations<string>
) {
	const match = matches(canonicalPath, Object.keys(translations))

	if (!match) return canonicalPath

	const translationsForPath = translations[match.id]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	return resolvePath(translatedPath, match.params)
}
