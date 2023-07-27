import type { LanguageTag } from "@inlang/language-tag"
import type { Message, Variant } from "./api.js"

export function getVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string | number>
	},
): Variant["pattern"] {
	return {} as any
}

export function createVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		data: Variant
	},
): Message {
	return {} as any
}

export function updateVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string | number>
		pattern: Variant["pattern"]
	},
): Message {
	return {} as any
}
