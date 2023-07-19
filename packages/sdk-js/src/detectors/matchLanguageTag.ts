import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import type { Detector } from "./types.js"

/**
 * A function that takes one or more detected languageTags and matches them with the specified available languageTags.
 * Depending on the passed allowRelated parameter also related languageTags ("en" and "en-GB") are considered a match.
 * Related matches are only considered if no perfect matches can be found.
 * @param detectedLanguageTags The detected languageTags available for matching. Either an array of strings, a single string or undefined
 * @param languageTags A set of available languageTags (strings) for matching. Insertion order is irrelevant
 * @param allowRelated A boolean specifying whether related languageTags ("en" and "en-US") can be considered if no perfect match can be found in availableLanguages and detected
 * @returns Return string in case of a successful match or otherwise undefined
 */
export const matchLanguageTag = (
	detectedLanguageTags: ReturnType<Detector>,
	languageTags: BCP47LanguageTag[],
	allowRelated = true,
) => {
	for (const detectedLanguageTag of detectedLanguageTags) {
		// check for perfect match
		for (const languageTag of languageTags) {
			if (languageTag === detectedLanguageTag) return languageTag
		}
	}
	for (const detectedLanguageTag of detectedLanguageTags) {
		if (allowRelated) {
			const relatedLanguageTags: string[] = languageTags
				.map(
					(languageTag) =>
						(languageTag.startsWith(detectedLanguageTag + "-") ||
							detectedLanguageTag.startsWith(languageTag + "-")) &&
						languageTag,
				)
				.filter(Boolean)
				// sort alphabetically
				.sort()
				// unspecific related languageTags should be preferred
				.sort((a, b) => a.split("-").length - b.split("-").length)

			if (relatedLanguageTags.length) return relatedLanguageTags[0]
		}
	}

	return undefined
}
