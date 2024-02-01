/**
 * The compiled paraglide runtime module.
 * (e.g. "paraglide/runtime.js")
 */
declare module "$$$$$$paraglide/runtime" {
	export const setLanguageTag: (language_tag: string | (() => string)) => void
	export const languageTag: () => string
	export const onSetLanguageTag: (callback: (language_tag: string) => void) => void
	export const isAvailableLanguageTag: (language_tag: unknown) => language_tag is string
	export const availableLanguageTags: readonly string[]
	export const sourceLanguageTag: string
}
