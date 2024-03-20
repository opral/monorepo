import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { HeaderNames } from "./constants"

/**
 * Returns the current language tag.
 * (server-side way)
 *
 * TODO: Replace with languageTag() from paraglide/runtime.js - Needs reliable way to call setLanguageTag() from middleware.tsx
 */
export function getLanguage<T extends string>(): T {
	const langHeader = headers().get(HeaderNames.ParaglideLanguage)
	const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	return lang as T
}
