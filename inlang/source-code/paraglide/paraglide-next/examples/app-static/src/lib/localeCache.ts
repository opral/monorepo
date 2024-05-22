import {
	AvailableLanguageTag,
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime"
import { cache } from "react"

/**
 * A request-scoped cache with the current langauge tag (if set)
 */
export const localeCache = cache((): { languageTag: string | undefined } => ({
	languageTag: undefined,
}))

/**
 * Call this function on every page & layout
 */
export function initializeLocaleCache(languageTag: AvailableLanguageTag) {
	if (!isAvailableLanguageTag(languageTag)) {
		console.warn("Invalid language tag:", languageTag)
	} else {
		localeCache().languageTag = languageTag
	}
}

export function makeLocaleAvailable() {
	setLanguageTag(() => {
		const cachedLanguageTag = localeCache().languageTag
		if (isAvailableLanguageTag(cachedLanguageTag)) return cachedLanguageTag
		console.warn("Falling back to source language tag")
		return sourceLanguageTag
	})
}
