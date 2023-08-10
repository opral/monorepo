import type { Message, LanguageTag } from "@inlang/app"
import { handleMissingMessage } from "./handleMissingMessage.js"

export const showFilteredMessage = (
	message: Message | undefined,
	filteredLanguageTags: LanguageTag[],
	textSearch: string,
	filteredLintRules: `${string}.${string}`[],
	messageId: string,
) => {
	// filteredByLanguage
	const filteredByLanguage = {
		...message,
		body: Object.fromEntries(
			Object.entries(message!.body).filter(([language]) => {
				if (filteredLanguageTags.length === 0) {
					return true
				} else {
					if (message !== undefined && filteredLanguageTags.includes(language)) {
						return true
					}
				}
				return false
			}),
		),
	} as Message


	// filteredById	
	const filteredById = (messageId === "" || (message !== undefined && message.id === messageId)) 
	? filteredByLanguage : undefined

	// filteredBySearch
	const filteredBySearch = (
		textSearch.length === 0 || 
		(
			message !== undefined &&
			(
				message?.id.toLowerCase().includes(textSearch.toLowerCase()) ||
				Object.values(message!.body).some((value) => {
						value[0]?.pattern.map((pattern) => {
							if (pattern.type === "Text") {
								return pattern.value.toLocaleLowerCase()
							} else if (pattern.type === "VariableReference") {
								return pattern.name.toLowerCase()
							} else {
								return false
							}
						}).join("").includes(textSearch.toLowerCase())
					}
				)
			)
		)
	) ? filteredById : undefined

	// // filteredByLintRules
	// const filteredByLintRules = filteredBySearch.filter((message) => {
	// 	if (filteredLintRules.length === 0) {
	// 		return true
	// 	} else {
	// 		for (const report of getLintReports(message!)) {
	// 			if (
	// 				filteredLintRules.includes(report.id) &&
	// 				handleMissingMessage(report, filteredLanguageTags)
	// 			) {
	// 				return true
	// 			}
	// 			false
	// 			continue
	// 		}
	// 	}
	// 	return false
	// })

	// return if matched
	return filteredBySearch
}
