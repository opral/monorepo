import type { LanguageTag } from '@inlang/core/languageTag'
import { matchLanguageTag } from "./matchLanguageTag.js"
import type { Detector } from "./types.js"

type DetectLanguageTagParams = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	allowRelated?: boolean
}

/**
 * Takes a set of detection strategies and returns a languageTag found in languageTags.
 * If no matching languageTag can be found, the specified fallback languageTag will be returned.
 * @param params Function parameters
 * @param params.strategies A Set of detectors ordered by precedence (preferred first) (as JS Sets preserve insertion order).
 * These detectors have to be functions that return either an array of strings, a single string or undefined
 * @param params.sourceLanguageTag The languageTag to fallback to if there is no detection match
 * @param params.languageTags Set of languageTags that are available for matching
 * @param params.allowRelated True if also related languageTags shall be considered a match.
 * The function will then return "en" from languageTags for a detected "en-GB" if no exact match can be found. It can also return "en-GB" from languageTags for a detected "en")
 * @returns The detected languageTag
 */
export const detectLanguageTag = async (
	{ sourceLanguageTag, languageTags, allowRelated = true }: DetectLanguageTagParams,
	...detectors: Detector[]
): Promise<LanguageTag> => {
	const allDetectedLanguageTags: LanguageTag[] = []
	for (const detector of detectors) {
		const detectedLanguages = await detector()
		const matchedLanguageTag = matchLanguageTag(detectedLanguages, languageTags, false)
		if (matchedLanguageTag) return matchedLanguageTag

		allDetectedLanguageTags.push(...detectedLanguages)
	}

	return (allowRelated && matchLanguageTag(allDetectedLanguageTags, languageTags)) || sourceLanguageTag
}
