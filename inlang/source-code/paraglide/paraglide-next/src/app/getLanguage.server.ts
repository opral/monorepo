import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { PARAGLIDE_LANGUAGE_HEADER_NAME } from "./constants"

/**
 * Returns the current language tag.
 * (server-side way)
 *
 * TODO: Replace with languageTag() from paraglide/runtime.js - Needs reliable way to call setLanguageTag() from middleware.tsx
 */
export function getLanguage<T extends string>(): T {
	const langHeader = headers().get(PARAGLIDE_LANGUAGE_HEADER_NAME)
	const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	return lang as T
}
