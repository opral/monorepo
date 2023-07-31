import type { MessageLintRule } from "@inlang/plugin"

export const missingMessageRule = (): MessageLintRule => ({
	meta: {
		id: "inlang.missingMessage",
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
		defaultLevel: "error",
	},
	message: ({ message: { id, body }, config, report }) => {
		const languageTags = config.languageTags.filter(
			(languageTag) => languageTag !== config.sourceLanguageTag,
		)
		for (const languageTag of languageTags) {
			const variants = body[languageTag] || []
			if (!variants.length) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Message with id '${id}' is missing for language tag '${languageTag}'.`,
					},
				})
				return
			}

			const patterns = variants.flatMap(({ pattern }) => pattern)
			if (patterns.length) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Message with id '${id}' has no patterns for language tag '${languageTag}'.`,
					},
				})
			} else if (
				patterns.length === 1 &&
				patterns[0]!.type === "Text" &&
				patterns[0]!.value === ""
			) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Message with id '${id}' has no content for language tag '${languageTag}'.`,
					},
				})
			}
		}
	},
})
