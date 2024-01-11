import type { PathTranslations } from "./path-translations.js"

export function getTranslatedPath(
	canonicalPath: string,
	lang: string,
	translations: PathTranslations<string>
) {
	const pathTranslations = translations[canonicalPath]
	if (pathTranslations) {
		const translatedPath = pathTranslations[lang]
		if (translatedPath) return translatedPath
	}
	return canonicalPath
}
