import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { PARAGLIDE_LANGUAGE_HEADER_NAME } from "./constants"

/**
 * Returns the current language tag.
 * (server-side way)
 *
 * THIS WILL BECOME OBSOLETE ONCE WE FIGURE OUT HOW TO SET THE LANGUAGE BEFORE ANY NEXT CODE RUNS
 * Once that's the case we will be able to just use `languageTag()` instead
 */
export function getLanguage<T extends string>(): T {
	const langHeader = headers().get(PARAGLIDE_LANGUAGE_HEADER_NAME)
	const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	return lang as T
}
