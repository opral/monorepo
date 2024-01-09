import type { MessageLintRule } from "@inlang/sdk"
import { id, displayName, description } from "../marketplace-manifest.json"

export const messageLintRule: MessageLintRule = {
	id: id as MessageLintRule["id"],
	displayName,
	description,
	// implement lint rule here
	run: ({ message, report, settings }) => {
		if (message.id.includes("-")) {
			report({
				messageId: message.id,
				languageTag: settings.sourceLanguageTag,
				body: "Message IDs should not contain dashes.",
			})
		}
	},
}
