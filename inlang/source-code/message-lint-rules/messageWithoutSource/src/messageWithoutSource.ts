import type { MessageLintRule } from "@inlang/message-lint-rule"
import { id, displayName, description } from "../marketplace-manifest.json"

export const messageWithoutSourceRule: MessageLintRule = {
	meta: {
		id: id as MessageLintRule["meta"]["id"],
		displayName,
		description,
	},
	message: ({ message: { id, variants }, sourceLanguageTag, report }) => {
		if (!variants.some((variant) => variant.languageTag === sourceLanguageTag)) {
			report({
				messageId: id,
				languageTag: sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`,
				},
			})
		}
	},
}
