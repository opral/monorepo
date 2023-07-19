import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import type { Detector } from "./types.js"

/**
 * A function that takes one or more detected languages and matches them with the specified available languages.
 * Depending on the passed allowRelated parameter also related languages ("en" and "en-GB") are considered a match.
 * Related matches are only considered if no perfect matches can be found.
 * @param detectedLanguages The detected languages available for matching. Either an array of strings, a single string or undefined
 * @param languages A set of available languages (strings) for matching. Insertion order is irrelevant
 * @param allowRelated A boolean specifying whether related languages ("en" and "en-US") can be considered if no perfect match can be found in availableLanguages and detected
 * @returns Return string in case of a successful match or otherwise undefined
 */
export const matchLanguage = (
	detectedLanguages: ReturnType<Detector>,
	languages: BCP47LanguageTag[],
	allowRelated = true,
) => {
	for (const detectedLanguage of detectedLanguages) {
		// check for perfect match
		for (const language of languages) {
			if (language === detectedLanguage) return language
		}
	}
	for (const detectedLanguage of detectedLanguages) {
		if (allowRelated) {
			const relatedLanguages: string[] = languages
				.map(
					(language) =>
						(language.startsWith(detectedLanguage + "-") ||
							detectedLanguage.startsWith(language + "-")) &&
						language,
				)
				.filter(Boolean)
				// sort alphabetically
				.sort()
				// unspecific related languages should be preferred
				.sort((a, b) => a.split("-").length - b.split("-").length)

			if (relatedLanguages.length) return relatedLanguages[0]
		}
	}

	return undefined
}
