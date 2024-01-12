import { matches } from "./matching/match.js"
import { resolvePath } from "./matching/resolvePath.js"
import type { PathTranslations } from "./types.js"

export function getTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathTranslations<string>
) {
	const pathTranslationsDefinition = Object.keys(translations).find((path) => {
		return matches(canonicalPath, path).matches
	})

	if (!pathTranslationsDefinition) return canonicalPath
	const translationsForPath = translations[pathTranslationsDefinition]
	if (!translationsForPath) return canonicalPath

	const translatedPath = translationsForPath[lang]
	if (!translatedPath) return canonicalPath

	const parseResult = matches(canonicalPath, pathTranslationsDefinition)
	if (!parseResult.matches) return canonicalPath

	return resolvePath(translatedPath, parseResult.params)
}
