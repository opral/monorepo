import type { MessageLintRule } from '@inlang/lint-api'

/**
 * Checks for missing messages (translations).
 *
 * If a message exists in the reference resource but is missing
 * in a target resource, it is likely that the message has not
 * been translated yet.
 */
export const missingMessage = () => ({
	id: 'inlang.missingMessage',
	displayName: {
		en: 'Missing Message'
	},
	defaultLevel: 'warn', // TODO: how to override level?
	message: ({ message: { id, body }, config, report }) => {
		const languageTags = config.languageTags.filter(languageTag => languageTag !== config.sourceLanguageTag)
		for (const languageTag of languageTags) {
			const variants = body[languageTag] || []
			if (!variants.length) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Message with id '${id}' is missing for '${languageTag}'.`, // TODO: simplify message as information is redundant
					}
				})
				return
			}

			const patterns = variants.flatMap(({ pattern }) => pattern)
			if (patterns.length) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Empty pattern (length 0).`,
					}
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
						en: `The pattern contains only only one element which is an empty string.`,
					}
				})
			}
		}
	},
}) satisfies MessageLintRule
