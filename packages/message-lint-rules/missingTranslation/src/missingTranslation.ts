import type { MessageLintRule } from "@inlang/message-lint-rule"
import { id, displayName, description } from "../marketplace-manifest.json"

export const missingTranslationRule: MessageLintRule = {
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
			if (!filteredVariants.length) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has a missing variant for language tag '${translatedLanguageTag}'.`,
					},
				})
			}
		}
		return
	},
}
