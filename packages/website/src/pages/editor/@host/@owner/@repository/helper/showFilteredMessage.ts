import type { LintReport, Message } from "@inlang/app"
import { useEditorState } from "../State.jsx"
export const showFilteredMessage = (message: Message | undefined) => {
	const { filteredLintRules, filteredLanguageTags, filteredId, textSearch, inlang } =
		useEditorState()
	// filteredByLanguage
	const filteredByLanguage = {
		...message,
		variants: message?.variants.filter((variant) => {
			if (filteredLanguageTags().length === 0) {
				return true
			} else {
				if (message !== undefined && filteredLanguageTags().includes(variant.languageTag)) {
					return true
				}
			}
			return false
		}),
	} as Message
	if (filteredByLanguage.variants.length === 0) return false

	// filteredById
	const filteredById =
		filteredId() === "" || (message !== undefined && message.id === filteredId())
			? filteredByLanguage
			: false

	// filteredBySearch
	const filteredBySearch =
		textSearch().length === 0 ||
		(message !== undefined &&
			(message?.id.toLowerCase().includes(textSearch().toLowerCase()) ||
				message.variants.some((variant) => {
					variant.pattern
						.map((pattern) => {
							if (pattern.type === "Text") {
								return pattern.value.toLocaleLowerCase()
							} else if (pattern.type === "VariableReference") {
								return pattern.name.toLowerCase()
							} else {
								return false
							}
						})
						.join("")
						.includes(textSearch().toLowerCase())
				})))
			? filteredById
			: false

	// filteredByLintRules
	const filteredByLintRules =
		filteredLintRules().length === 0 ||
		(message !== undefined &&
			// filtered report includes messageId and lintRuleId
			inlang()
				?.lint.reports()
				.some((report: LintReport) => {
					if (
						filteredLintRules().includes(report.ruleId) &&
						filteredLanguageTags().includes(report.languageTag) &&
						report.messageId === message?.id
					) {
						return true
					}
					return false
				}))
			? filteredBySearch
			: false

	// return matches all filters
	return filteredByLintRules
}
