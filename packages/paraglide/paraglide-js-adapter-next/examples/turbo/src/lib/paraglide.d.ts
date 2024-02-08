export interface Paraglide<T extends string> {
	setLanguageTag: (language_tag: T | (() => T)) => void
	languageTag: () => T
	onSetLanguageTag: (callback: (language_tag: T) => void) => void
	isAvailableLanguageTag: (language_tag: any) => language_tag is T
	availableLanguageTags: readonly T[]
	sourceLanguageTag: T
}
