import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import type { Detector } from "./types.js"

/**
 * A function that takes one or more detected languageTags and matches them with the specified available languageTags.
 * Depending on the passed allowRelated parameter also related languageTags ("en" and "en-GB") are considered a match.
 * Related matches are only considered if no perfect matches can be found.
 * @param detectedLanguages The detected languageTags available for matching. Either an array of strings, a single string or undefined
 * @param languageTags A set of available languageTags (strings) for matching. Insertion order is irrelevant
 * @param allowRelated A boolean specifying whether related languageTags ("en" and "en-US") can be considered if no perfect match can be found in availableLanguages and detected
 * @returns Return string in case of a successful match or otherwise undefined
 */
export const matchLanguage = (
	detectedLanguages: ReturnType<Detector>,
	languageTags: BCP47LanguageTag[],
	allowRelated = true,
) => {
	for (const detectedLanguage of detectedLanguages) {
		// check for perfect match
		for (const languageTag of languageTags) {
			if (languageTag === detectedLanguage) return languageTag
		}
	}
	for (const detectedLanguage of detectedLanguages) {
		if (allowRelated) {
			const relatedLanguages: string[] = languageTags
				.map(
					(languageTag) =>
						(languageTag.startsWith(detectedLanguage + "-") ||
							detectedLanguage.startsWith(languageTag + "-")) &&
						languageTag,
				)
				.filter(Boolean)
				// sort alphabetically
				.sort()
				// unspecific related languageTags should be preferred
				.sort((a, b) => a.split("-").length - b.split("-").length)

			if (relatedLanguages.length) return relatedLanguages[0]
		}
	}

	return undefined
}
