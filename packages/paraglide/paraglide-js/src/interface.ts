import type { LanguageTag } from "@inlang/sdk"

export type RuntimeApi = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	currentLanguageTag: () => LanguageTag
	setCurrentLanguageTag: (tag: LanguageTag) => void
	// selectors: () => Variant["match"]
	// setSelectors: (newSelectors: Variant["match"]) => void
	/**
	 * Lookup function for a message.
	 */
	m: (id: string, params: Record<string, any>) => string
}
