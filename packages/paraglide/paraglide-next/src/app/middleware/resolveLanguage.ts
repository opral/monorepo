import { NextRequest } from "next/server"
import { ResolvedI18nConfig } from "../config"
import { LanguageDetector } from "./detection/interface"

/**
 * Returns the language that should be used for this request using the listed detectors
 *
 * @param nextRequst
 * @param strategy
 */
export function resolveLanguage<T extends string>(
	request: NextRequest,
	defaultLanguage: T,
	detectors: LanguageDetector<T>[]
): T {
	for (const detector of detectors) {
		const locale = detector(request)
		if (locale) return locale
	}
	return defaultLanguage
}
