import type { LanguageTag } from "@inlang/sdk"

/**
 * Returns the fallback languages for all available languages.
 *
 * The list is ordered by priority, with the first language being the most preferred.
 * All languages are available language tags.
 *
 * The returned list is exclusive, meaning that the language itself is not included.
 * If there are no fallback languages, an empty array is returned.
 *
 * @returns
 */
export function getFallbackLanguages<LanguageTags extends LanguageTag[]>(
	availableLanguageTags: LanguageTags,
	sourceLanguageTag: LanguageTags[number]
): Record<LanguageTags[number], LanguageTags[number][]> {
	const fallbackLanguages: Record<LanguageTags[number], string[]> = {} as any

	for (const _languageTag of availableLanguageTags) {
		const languageTag = _languageTag as LanguageTags[number]
		if (!fallbackLanguages[languageTag]) fallbackLanguages[languageTag] = [] as string[]

		const languageTagParts = languageTag.split("-")
		for (let i = languageTagParts.length - 1; i > 0; i--) {
			const fallbackLanguageTag = languageTagParts.slice(0, i).join("-")
			if (!availableLanguageTags.includes(fallbackLanguageTag)) continue
			fallbackLanguages[languageTag].push(fallbackLanguageTag)
			if (fallbackLanguageTag === sourceLanguageTag) break
		}

		if (!fallbackLanguages[languageTag].includes(sourceLanguageTag)) {
			fallbackLanguages[languageTag].push(sourceLanguageTag)
		}
	}

	fallbackLanguages[sourceLanguageTag] = []

	return fallbackLanguages
}
