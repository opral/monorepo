import type { MessageLintRule } from '@inlang/lint-api'

/**
 * Checks for likely outdated messages.
 *
 * A message with a missing source is usually an indication that
 * the message (id) is no longer used in source code, but messages
 * have not been updated accordingly.
 */
export const messageWithoutSource = () => ({
	id: "inlang.messageWithoutSource",
	displayName: {
		en: 'Message Without Source'
	},
	defaultLevel: 'warn', // TODO: how to override level?
	message: ({ message: { id, body }, config, report }) => {
		if (Object.keys(body).length && !body[config.sourceLanguageTag]) {
			report({
				messageId: id,
				languageTag: config.sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`, // TODO: simplify message as information is redundant
				}
			})
		}
	},
}) satisfies MessageLintRule
