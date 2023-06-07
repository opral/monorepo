import type { LanguageTag } from "@inlang/core/ast"
import { createLintRule } from "@inlang/core/lint"

/**
 * Checks for missing messages (translations).
 *
 * If a message exists in the reference resource but is missing
 * in a target resource, it is likely that the message has not
 * been translated yet.
 */
export const missingMessage = createLintRule({
	id: "inlang.missingMessage",
	setup: ({ report }) => {
		let targetMessageLanguage: LanguageTag["name"] | undefined
		return {
			visitors: {
				Resource: ({ target }) => {
					targetMessageLanguage = target?.languageTag.name
				},
				Message: ({ target, reference }) => {
					if (!target && reference) {
						report({
							node: reference,
							message: `Message with id '${reference.id.name}' is missing for '${targetMessageLanguage}'.`,
						})
					} else if (target?.pattern.elements.length === 0) {
						report({
							node: target,
							message: `Empty pattern (length 0).`,
						})
					} else if (
						target?.pattern.elements.length === 1 &&
						target.pattern.elements[0].type === "Text" &&
						target.pattern.elements[0].value === ""
					) {
						report({
							node: target,
							message: `The pattern contains only only one element which is an empty string.`,
						})
					}
				},
			},
		}
	},
})
