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
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules",
			},
			keywords: ["lint-rule", "standard", "missing-message"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, body }, languageTags, sourceLanguageTag, report }) => {
		const translatedLanguageTags = languageTags.filter(
			(languageTag) => languageTag !== sourceLanguageTag,
		)

		for (const translatedLanguageTag of translatedLanguageTags) {
			const variants = body[translatedLanguageTag] ?? []

			if (!variants.length) {
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
