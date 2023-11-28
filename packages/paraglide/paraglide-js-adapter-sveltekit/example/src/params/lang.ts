import { availableLanguageTags, type AvailableLanguageTag } from "$paraglide/runtime"

export const match = (thing: any): thing is AvailableLanguageTag => {
	return availableLanguageTags.includes(thing)
}
