import type { Language } from "@inlang/core/ast"
import { matchLanguage } from "./matchLanguage.js"
import type { Detector } from "./types.js"

type DetectLanguageParams = {
	referenceLanguage: Language
	languages: Array<Language>
	allowRelated?: boolean
}

/**
 * Takes a set of detection strategies and returns a language found in languages.
 * If no matching language can be found, the specified fallback Language will be returned.
 * @param params Function parameters
 * @param params.strategies A Set of detectors ordered by precedence (preferred first) (as JS Sets preserve insertion order).
 * These detectors have to be functions that return either an array of strings, a single string or undefined
 * @param params.referenceLanguage The language to fallback to if there is no detection match
 * @param params.languages Set of languages that are available for matching
 * @param params.allowRelated True if also related languages shall be considered a match.
 * detectLanguage will then return "en" from languages for a detected "en-GB" if no exact match can be found. It can also return "en-GB" from languages for a detected "en")
 * @returns The detected language
 */
export const detectLanguage = async (
	{ referenceLanguage, languages, allowRelated = true }: DetectLanguageParams,
	...detectors: Detector[]
): Promise<Language> => {
	const allDetectedLanguages: Array<Language> = []
	for (const detector of detectors) {
		const detectedLanguages = await detector()
		const matchedLanguage = matchLanguage(detectedLanguages, languages, false)
		if (matchedLanguage) return matchedLanguage

		allDetectedLanguages.push(...detectedLanguages)
	}

	return allowRelated && matchLanguage(allDetectedLanguages, languages) || referenceLanguage
}
