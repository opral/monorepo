import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { LANGUAGE_HEADER } from "../constants"

/**
 * Returns the current language tag.
 * (server-side way) 
 * 
 * TODO: Replace with languageTag() from paraglide/runtime.js - Needs reliable way to call setLanguageTag() from middleware.tsx
 */
export function getLanguage() {
	const langHeader = headers().get(LANGUAGE_HEADER)
	const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	return lang
}
