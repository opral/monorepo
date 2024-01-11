type PathTranslations = {
	[canonicalPath: string]: {
		[languageTag: string]: string
	}
}

export function getCanonicalPath(
	path: string,
	lang: string,
	translations: PathTranslations
): string {
	for (const [canonicalPath, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue
		if (translationsForPath[lang] === path) return canonicalPath
	}

	return path
}
