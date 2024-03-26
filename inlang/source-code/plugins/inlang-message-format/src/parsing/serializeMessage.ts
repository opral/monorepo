import type { LanguageTag, Message } from "@inlang/sdk"
import { serializedPattern } from "./serializePattern.js"

export const serializeMessage = (message: Message): Record<LanguageTag, string> => {
	//group variants by language tag while preserving order
	const variantsByLanguageTag = groupByLanguageTag(message.variants)

	const result: Record<LanguageTag, string> = {}
	for (const [languageTag, variants] of Object.entries(variantsByLanguageTag)) {
		if (variants.length == 1) {
			// @ts-ignore
			result[languageTag] = serializedPattern(variants[0].pattern)
			continue
		}

		for (const variant of variants) {
			if (variant.match.length !== message.selectors.length) {
				throw new Error("All variants must provide a selector-value for all selectors")
			}
		}

		const statement =
			"match " +
			message.selectors.map((ref) => "{" + ref.name + "}").join(" ") +
			" " +
			variants
				.map((variant) => `when ${variant.match.join(" ")} {${serializedPattern(variant.pattern)}}`)
				.join(" ")

		result[languageTag] = statement
	}
	return result
}

function groupByLanguageTag(
	variants: Message["variants"]
): Record<LanguageTag, Message["variants"]> {
	const result: Record<LanguageTag, Message["variants"]> = {}

	for (const variant of variants) {
		const variantsForLanguage = result[variant.languageTag] ?? []
		variantsForLanguage.push(variant)
		result[variant.languageTag] = variantsForLanguage
	}
	return result
}
