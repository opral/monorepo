import "../ambient"
import { setLanguageTag, languageTag } from "$paraglide/runtime.js"

export function someFunction() {
	setLanguageTag("de")
	return languageTag()
}
