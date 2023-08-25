import type { MessageLintRule } from "@inlang/lint"

export const missingTranslationRule: MessageLintRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.missingTranslation",
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
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/blob/main/source-code/plugins/standard-lint-rules/README.md",
			},
			keywords: ["lint-rule", "standard", "missing-translation"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
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
				return
			}
		}
	},
}
