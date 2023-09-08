import type { MessageLintRule } from "@inlang/message-lint-rule"
import { id, displayName, description } from "../marketplace-manifest.json"

export const emptyPatternRule: MessageLintRule = {
	meta: {
		id: id as MessageLintRule["meta"]["id"],
		displayName,
		description,
	},
	message: ({ message: { id, variants }, languageTags, sourceLanguageTag, report }) => {
		const translatedLanguageTags = languageTags.filter(
			(languageTag) => languageTag !== sourceLanguageTag,
		)
		for (const translatedLanguageTag of translatedLanguageTags) {
			const filteredVariants =
				variants.filter((variant) => variant.languageTag === translatedLanguageTag) ?? []
			if (filteredVariants.length === 0) return
			const patterns = filteredVariants.flatMap(({ pattern }) => pattern)
			if (!patterns.length) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has no patterns for language tag '${translatedLanguageTag}'.`,
					},
				})
			} else if (
				patterns.length === 1 &&
				patterns[0]?.type === "Text" &&
				patterns[0]?.value === ""
			) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has no content for language tag '${translatedLanguageTag}'.`,
					},
				})
			}
		}
	},
}
