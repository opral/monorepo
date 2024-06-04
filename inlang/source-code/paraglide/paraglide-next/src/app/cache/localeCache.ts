// rsc only

import { isAvailableLanguageTag, sourceLanguageTag } from "$paraglide/runtime.js"
import { cache } from "react"
import { DEV } from "../env"

/**
 * A request-scoped cache with the current langauge tag (if set)
 */
export const localeCache = cache<() => { current: string | undefined }>(() => ({
	current: undefined,
}))

/**
 * Call this function on before using `languageTag()`
 */
export function setLocaleCache(languageTag: string) {
	if (!isAvailableLanguageTag(languageTag)) {
		if (DEV) console.warn("Invalid language tag:", languageTag)
	} else {
		localeCache().current = languageTag
	}
}

export function getLocaleCache() {
	const cachedLanguageTag = localeCache().current
	if (isAvailableLanguageTag(cachedLanguageTag)) return cachedLanguageTag
	if (DEV) console.warn("Falling back to source language tag")
	return sourceLanguageTag
}
