import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import { matchLanguage } from "./matchLanguage.js"
import type { Detector } from "./types.js"

type DetectLanguageParams = {
	sourceLanguageTag: BCP47LanguageTag
	languageTags: BCP47LanguageTag[]
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
 * detectLanguage will then return "en" from languageTags for a detected "en-GB" if no exact match can be found. It can also return "en-GB" from languageTags for a detected "en")
 * @returns The detected languageTag
 */
export const detectLanguage = async (
	{ sourceLanguageTag, languageTags, allowRelated = true }: DetectLanguageParams,
	...detectors: Detector[]
): Promise<BCP47LanguageTag> => {
	const allDetectedLanguages: BCP47LanguageTag[] = []
	for (const detector of detectors) {
		const detectedLanguages = await detector()
		const matchedLanguage = matchLanguage(detectedLanguages, languageTags, false)
		if (matchedLanguage) return matchedLanguage

		allDetectedLanguages.push(...detectedLanguages)
	}

	return (allowRelated && matchLanguage(allDetectedLanguages, languageTags)) || sourceLanguageTag
}
