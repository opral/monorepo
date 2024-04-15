import { NextRequest } from "next/server"
import { ResolvedI18nConfig } from "../config"
import { LanguageDetector } from "./detection/interface"

/**
 * Returns the language that should be used for this request
 *
 *  1. User-Configured resolveLanuage (may be undefined)
 *  2. NEXT_LOCALE Cookie (may be undefined)
 *  3. Negotiate Language (with default as fallback)
 *
 * @param nextRequst
 * @param strategy
 */
export function resolveLanguage<T extends string>(
	request: NextRequest,
	config: ResolvedI18nConfig<T>,
	detectors: LanguageDetector<T>[]
): T {
	for (const detector of detectors) {
		const locale = detector(request)
		if (locale) return locale
	}
	return config.defaultLanguage
}
