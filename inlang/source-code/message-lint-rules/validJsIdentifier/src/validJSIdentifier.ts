import type { MessageLintRule } from "@inlang/message-lint-rule"
import { id, displayName, description } from "../marketplace-manifest.json"
import { KEYWORDS } from "./reservedKeywords.js"

export const validJsIdentifier: MessageLintRule = {
	id: id as MessageLintRule["id"],
	displayName,
	description,
	run: ({ message, settings, report }) => {
		// There are some keywords that _are_ valid variable names in certain contexts.
		// To be safe we always disallow them.
		if (KEYWORDS.includes(message.id) || !isValidJsIdentifier(message.id)) {
			report({
				messageId: message.id,
				languageTag: settings.sourceLanguageTag,
				body: {
					en: `The message ID '${message.id}' is not a valid javascript identifier.`,
				},
			})
		}

		return
	},
}

/*
 * is-var-name | ISC (c) Shinnosuke Watanabe
 * https://github.com/shinnn/is-var-name
 */
function isValidJsIdentifier(str: string): boolean {
	if (str.trim() !== str) {
		return false
	}

	try {
		new Function(str, "var " + str)
	} catch (_) {
		return false
	}

	return true
}
