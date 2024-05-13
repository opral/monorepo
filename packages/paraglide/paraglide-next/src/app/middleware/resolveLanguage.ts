import { NextRequest } from "next/server"
import { LanguageDetector } from "./detection/interface"

/**
 * Returns the language that should be used for this request using the listed detectors
 *
 * @param nextRequst
 * @param strategy
 */
export function resolveLanguage<T extends string>(
	request: NextRequest,
	fallbackLanguage: T,
	detectors: LanguageDetector<T>[]
): T {
	for (const detector of detectors) {
		const locale = detector(request)
		if (locale) return locale
	}
	return fallbackLanguage
}
