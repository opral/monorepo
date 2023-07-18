import { createLintRule } from "@inlang/core/lint"

/**
 * Checks for likely outdated messages.
 *
 * A message with a missing reference is usually an indication that
 * the message (id) is no longer used in source code, but resources
 * have not been updated accordingly.
 */
export const messageWithoutReference = createLintRule({
	id: "inlang.messageWithoutReference",
	setup: ({ config, report }) => {
		return {
			visitors: {
				Resource: ({ target }) => {
					if (target && target.languageTag.name === config.sourceLanguageTag) {
						return "skip"
					}
				},
				Message: ({ target, reference }) => {
					if (!reference && target) {
						report({
							node: target,
							message: `Message with id '${target.id.name}' is specified, but missing in the reference.`,
						})
					}
				},
			},
		}
	},
})
