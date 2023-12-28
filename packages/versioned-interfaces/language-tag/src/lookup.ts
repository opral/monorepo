import type { LanguageTag } from "./interface.js"

/**
 * Returns the lookup order for the given language-tags according to the IETF BCP 47 spec.
 *
 * All returned languages are available language tags.
 * The returned list is inclusive, meaning that the language itself is included.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4647#section-3.4
 */
export function getLookupOrder<LanguageTags extends readonly LanguageTag[]>(
	availableLanguageTags: LanguageTags,
	sourceLanguageTag: LanguageTags[number]
): Record<LanguageTags[number], LanguageTags[number][]> {
	const fallbackLanguages: Record<LanguageTags[number], string[]> = {} as any

	for (const _languageTag of availableLanguageTags) {
		const languageTag = _languageTag as LanguageTags[number]
		if (!fallbackLanguages[languageTag]) fallbackLanguages[languageTag] = [] as string[]
		const languageTagParts = languageTag.split("-")

		for (let i = languageTagParts.length; i > 0; i--) {
			const fallbackLanguageTag = languageTagParts.slice(0, i).join("-")
			if (!availableLanguageTags.includes(fallbackLanguageTag)) continue
			fallbackLanguages[languageTag].push(fallbackLanguageTag)
			if (fallbackLanguageTag === sourceLanguageTag) break
		}

		if (!fallbackLanguages[languageTag].includes(sourceLanguageTag)) {
			fallbackLanguages[languageTag].push(sourceLanguageTag)
		}
	}

	fallbackLanguages[sourceLanguageTag] = [sourceLanguageTag]
	return fallbackLanguages
}
