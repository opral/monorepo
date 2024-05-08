import { negotiateLanguagePreferences } from "@inlang/paraglide-js/internal/adapter-utils"
import { LanguageDetector } from "./interface"
import { ACCEPT_LANGUAGE_HEADER_NAME } from "../../constants"

export const createAcceptLanguageDetection =
	<T extends string>(cfg: { availableLanguageTags: readonly T[] }): LanguageDetector<T> =>
	(request) => {
		const acceptLanguage = request.headers.get(ACCEPT_LANGUAGE_HEADER_NAME)
		const preferences = negotiateLanguagePreferences(acceptLanguage, cfg.availableLanguageTags)
		return preferences.at(0)
	}
