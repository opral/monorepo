"use client"
import {
	isAvailableLanguageTag,
	onSetLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"

// needed for messages in module-scope code
setLanguageTag(() => {
	const documentLang = document.documentElement.lang
	return isAvailableLanguageTag(documentLang) ? documentLang : sourceLanguageTag
})

onSetLanguageTag((newLanguagTag) => {
	console.log("onSetLanguageTag", newLanguagTag)
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
