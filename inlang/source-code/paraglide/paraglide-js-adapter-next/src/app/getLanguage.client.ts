import { languageTag } from "$paraglide/runtime.js"

/**
 * Returns the current language tag.
 * (client-side way) 
 */
export function getLanguage() {
	return languageTag()
}
