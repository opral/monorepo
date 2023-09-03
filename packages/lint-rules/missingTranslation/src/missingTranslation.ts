import type { MessageLintRule } from "@inlang/message-lint-rule"

export const missingTranslationRule: MessageLintRule = {
	meta: {
		id: "messageLintRule.inlang.missingTranslation",
		displayName: {
			en: "Missing Translation",
		},
		description: {
			en: `
Checks for missing variants for a specific languageTag.

If a variant exists for the sourceLanguageTag but is missing
for a listed languageTag, it is likely that the message has not
been translated for this languageTag yet.
`,
		},
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
