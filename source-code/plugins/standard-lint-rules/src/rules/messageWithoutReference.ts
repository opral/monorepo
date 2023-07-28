import type { MessageLintRule } from "@inlang/plugin"

/**
 * Checks for likely outdated messages.
 *
 * A message with a missing source is usually an indication that
 * the message (id) is no longer used in source code, but messages
 * have not been updated accordingly.
 */
export const messageWithoutSource = (): MessageLintRule => ({
	id: "inlang.messageWithoutSource",
	displayName: {
		en: "Message Without Source",
	},
	defaultLevel: "warn", // TODO: how to override level? // reply from @samuelstroschein: you can't. the app sets the lint level. a rule can only set a default.
	message: ({ message: { id, body }, config, report }) => {
		if (Object.keys(body).length && !body[config.sourceLanguageTag]) {
			report({
				messageId: id,
				languageTag: config.sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`, // TODO: simplify message as information is redundant
				},
			})
		}
	},
})
