import { LanguageDetector } from "./interface"
import { detectLanguageFromPath } from "@inlang/paraglide-js/internal/adapter-utils"

export const createPrefixDetection = <T extends string>(cfg: {
	availableLanugageTags: readonly T[]
}): LanguageDetector<T> => ({
	resolveLanguage(request) {
		return detectLanguageFromPath({
			path: request.nextUrl.pathname,
			availableLanguageTags: cfg.availableLanugageTags,
		})
	},
})
