import type * as ast from "@inlang/core/ast"
import { LintedMessage, getLintReports } from "@inlang/core/lint"
import { handleMissingMessage } from "./handleMissingMessage.js"
import type { BCP47LanguageTag } from "@inlang/core/languageTag"

export const showFilteredMessage = (
	messages: Record<ast.Resource["languageTag"]["name"], LintedMessage | undefined>,
	filteredLanguageTags: BCP47LanguageTag[],
	textSearch: string,
	filteredLintRules: `${string}.${string}`[],
	messageId: string,
) => {
	// filteredByLanguage
	const filteredByLanguage = Object.keys(messages)
		.filter((key) => filteredLanguageTags.length === 0 || filteredLanguageTags.includes(key))
		.reduce((filteredMessage, key) => {
			filteredMessage[key] = messages[key]
			return filteredMessage
		}, {} as { [key: string]: LintedMessage | undefined })

	// filteredById
	const filteredById = Object.values(filteredByLanguage).filter((message) => {
		if (messageId === "") {
			return true
		} else {
			if (message !== undefined && message.id.name === messageId) {
				return true
			}
		}
		return false
	})

	// filteredBySearch
	const filteredBySearch = filteredById.filter((message) => {
		if (textSearch.length === 0) {
			return true
		} else {
			if (
				message !== undefined &&
				textSearch.length > 0 &&
				(message?.id.name.toLowerCase().includes(textSearch.toLowerCase()) ||
					JSON.stringify(message).toLowerCase().includes(textSearch.toLowerCase()))
			) {
				return true
			}
		}
		return false
	})

	// filteredByLintRules
	const filteredByLintRules = filteredBySearch.filter((message) => {
		if (filteredLintRules.length === 0) {
			return true
		} else {
			for (const report of getLintReports(message!)) {
				if (
					filteredLintRules.includes(report.id) &&
					handleMissingMessage(report, filteredLanguageTags)
				) {
					return true
				}
				false
				continue
			}
		}
		return false
	})

	// return if matched
	return filteredByLintRules
}
