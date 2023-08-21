import type { MessageLintRule } from "@inlang/lint"

export const missingMessageRule: MessageLintRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.missingMessage",
		displayName: {
			en: "Missing Message",
		},
		description: {
			en: `
Checks for missing messages in a language tag.

If a message exists in the reference resource but is missing
in a target resource, it is likely that the message has not
been translated yet.
`,
		},
	},
	message: ({ message: { id, variants }, languageTags, sourceLanguageTag, report }) => {
		const translatedLanguageTags = languageTags.filter(
			(languageTag) => languageTag !== sourceLanguageTag,
		)

		for (const translatedLanguageTag of translatedLanguageTags) {
			const filteredVariants = variants.filter((variant) => variant.languageTag === translatedLanguageTag) ?? []
			if (!filteredVariants.length 
				|| JSON.stringify(filteredVariants[0]?.pattern) === "[]"
				|| filteredVariants[0]?.pattern?.length === 1 && 
					filteredVariants[0]?.pattern[0]?.type === "Text" &&
					filteredVariants[0]?.pattern[0]?.value === ""
			) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' is missing for language tag '${translatedLanguageTag}'.`,
					},
				})
				return
			}

			const patterns = variants.flatMap(({ pattern }) => pattern)
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
