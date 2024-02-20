import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { LANGUAGE_HEADER } from "../constants"

export function getLanguage() {
	const langHeader = headers().get(LANGUAGE_HEADER)
	const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	return lang
}
