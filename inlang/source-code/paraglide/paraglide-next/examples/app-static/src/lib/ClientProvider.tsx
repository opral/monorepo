"use client"

import {
	AvailableLanguageTag,
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime"

// needed for messages in module-scope code
setLanguageTag(() => {
	const documentLang = document.documentElement.lang
	return isAvailableLanguageTag(documentLang) ? documentLang : sourceLanguageTag
})

export function ClientProvider({ languageTag }: { languageTag: AvailableLanguageTag }) {
	setLanguageTag(languageTag)
	return undefined
}
