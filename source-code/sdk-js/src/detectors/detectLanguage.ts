import type { Language } from "@inlang/core/ast"
import { matchLanguage } from "./matchLanguage.js"
import type { Detector } from "./types.js"

/**
 * Takes a set of detection strategies and returns a language found in availableLanguages.
 * If no matching language can be found, the specified fallback Language will be returned.
 * @param params Function parameters
 * @param params.strategies A Set of detectors ordered by precedence (preferred first) (as JS Sets preserve insertion order).
 * These detectors have to be functions that return either an array of strings, a single string or undefined
 * @param params.fallbackLanguage The language to fallback to if there is no detection match
 * @param params.availableLanguages Set of languages that are available for matching
 * @param params.allowRelated True if also related languages shall be considered a match.
 * detectLanguage will then return "en" from availableLanguages for a detected "en-GB" if no exact match can be found. It can also return "en-GB" from availableLanguages for a detected "en")
 * @returns The detected language
 */

export const detectLanguage = ({
	strategies,
	fallbackLanguage,
	availableLanguages,
	allowRelated = true,
}: {
	strategies: Set<Detector>
	fallbackLanguage: Language
	availableLanguages: Set<Language>
	allowRelated: boolean
}): Language => {
	const detected: ReturnType<Detector> = []
	// Return exact match immediately after detection
	for (const detector of strategies) {
		const d = detector()
		const exactMatch = matchLanguage(d, availableLanguages)
		if (exactMatch !== undefined) return exactMatch
		if (d !== undefined) detected.push(...(typeof d === "string" ? [d] : d))
	}
	// Return related match or fallbackLanguage if no exact match can be found
	return allowRelated
		? matchLanguage(detected, availableLanguages, true) ?? fallbackLanguage
		: fallbackLanguage
}
