import { MessageLintRule } from "@inlang/sdk"
import { id, displayName, description } from "../marketplace-manifest.json"

export const messageLintRule: MessageLintRule = {
	meta: {
		id: id as MessageLintRule["meta"]["id"],
		displayName,
		description,
	},
	// implement lint rule here
	message: ({ message, report, sourceLanguageTag }) => {
		if (message.id.includes("-")) {
			report({
				messageId: message.id,
				languageTag: sourceLanguageTag,
				body: "Message IDs should not contain dashes.",
			})
		}
	},
}
