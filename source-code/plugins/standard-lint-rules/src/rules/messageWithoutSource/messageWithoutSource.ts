import type { MessageLintRule } from "@inlang/plugin"

export const messageWithoutSourceRule = (): MessageLintRule => ({
	meta: {
		id: "inlang.messageWithoutSource",
		displayName: {
			en: "Message Without Source",
		},
		description: {
			en: `
Checks for likely outdated messages.

A message with a missing source is usually an indication that
the message (id) is no longer used in source code, but messages
have not been updated accordingly.
`,
		},
		defaultLevel: "error",
	},
	message: ({ message: { id, body }, config, report }) => {
		if (Object.keys(body).length && !body[config.sourceLanguageTag]) {
			report({
				messageId: id,
				languageTag: config.sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`,
				},
			})
		}
	},
})
