"use client"
import { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag } from "$paraglide/runtime.js"

// needed for messages in module-scope code
setLanguageTag(() => {
	// in case it's run on the server during build, 
	// just return the source language tag
  if (typeof document === "undefined") return sourceLanguageTag
	const documentLang = document.documentElement.lang
	return isAvailableLanguageTag(documentLang) ? documentLang : sourceLanguageTag
})

/**
 * A client side component that sets the language tag on mount.
 * @param props
 * @returns
 */
export function ClientLanguageProvider(props: { language: string }) {
	setLanguageTag(props.language)
	return undefined
}
