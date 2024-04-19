import { LanguageDetector } from "./interface"
import { detectLanguageFromPath } from "@inlang/paraglide-js/internal/adapter-utils"

export const createPrefixDetection =
	<T extends string>(cfg: { availableLanguageTags: readonly T[] }): LanguageDetector<T> =>
	(request) => {
		return detectLanguageFromPath({
			path: request.nextUrl.pathname,
			availableLanguageTags: cfg.availableLanguageTags,
		})
	}
