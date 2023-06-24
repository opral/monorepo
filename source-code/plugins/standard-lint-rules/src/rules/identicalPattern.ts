import type { LanguageTag } from "@inlang/core/ast"
import { createLintRule } from "@inlang/core/lint"

/**
 * Checks for identical patterns in different languages.
 *
 * A message with identical wording in multiple languages can indicate
 * that the translations are redundant or can be combined into a single
 * message to reduce translation effort.
 */
export const identicalPattern = createLintRule({
	id: "inlang.identicalPattern",
	setup: ({ config, report }) => {
		let targetMessageLanguage: LanguageTag["name"] | undefined
		return {
			visitors: {
				Resource: ({ target, reference }) => {
					targetMessageLanguage = target?.languageTag.name
					if (
						(target && target.languageTag.name === config.referenceLanguage) ||
						!target?.body.find((element) => element.pattern) ||
						!reference?.body.find((element) => element.pattern)
					) {
						return "skip"
					}
				},
				Message: ({ target, reference }) => {
					if (reference?.pattern === undefined || target?.pattern === undefined) {
						return "skip"
					}

					const referenceMessage = JSON.stringify(reference?.pattern)
					const targetMessage = JSON.stringify(target?.pattern)

					const numOfWords = reference.pattern.elements
						.filter((element) => {
							return element.type === "Text"
						})
						.map((element) => element.value)
						.join(" ")
						.split(" ").length

					if (referenceMessage === targetMessage && numOfWords >= 3) {
						report({
							node: target,
							message: `Identical message found in language '${targetMessageLanguage}' with message ID '${target.id.name}'.`,
						})
					}
				},
			},
		}
	},
})
