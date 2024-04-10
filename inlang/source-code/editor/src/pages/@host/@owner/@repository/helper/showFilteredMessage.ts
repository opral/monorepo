import type { MessageLintReport, Message } from "@inlang/sdk"
import { useEditorState } from "../State.jsx"
export const showFilteredMessage = (
	message: Message | undefined,
	lintReports: readonly MessageLintReport[] | undefined
) => {
	const { filteredMessageLintRules, filteredLanguageTags, filteredIds, textSearch, project } =
		useEditorState()

	// Early exit if variants are empty
	if (!message?.variants.length) {
		return false
	}

	const languageTagsSet = new Set(
		filteredLanguageTags().length === 0
			? project()?.settings()?.languageTags
			: filteredLanguageTags()
	)
	const lintRulesSet = new Set(filteredMessageLintRules())
	const searchLower = textSearch().toLowerCase()

	// Map and join patterns
	const patternsLower = message?.variants
		.flatMap((variant) =>
			variant.pattern.map((pattern) => {
				if (pattern.type === "Text") {
					return pattern.value.toLowerCase()
				} else if (pattern.type === "VariableReference") {
					return pattern.name.toLowerCase()
				}
				return ""
			})
		)
		.join("")

	// filteredByLanguage
	const filteredByLanguage = {
		...message,
		variants: message.variants.filter(
			(variant) => languageTagsSet.size === 0 || languageTagsSet.has(variant.languageTag)
		),
	}

	// filteredById
	const filteredById =
		filteredIds().length === 0 || (message !== undefined && filteredIds().includes(message.id))
			? filteredByLanguage
			: false

	// filteredBySearch
	const filteredBySearch =
		searchLower.length === 0 ||
		(message !== undefined &&
			(message.id.toLowerCase().includes(searchLower) ||
				(typeof message.alias === "object" &&
					// TODO: #2346 review alias search logic not to include "default" key name
					JSON.stringify(message.alias).toLowerCase().includes(searchLower)) ||
				patternsLower.includes(searchLower)))
			? filteredById
			: false

	// filteredByLintRules
	const filteredByLintRules =
		lintRulesSet.size === 0 ||
		(message !== undefined &&
			lintReports?.some(
				(report: MessageLintReport) =>
					lintRulesSet.has(report.ruleId) && languageTagsSet.has(report.languageTag)
			))
			? filteredBySearch
			: false

	return filteredByLintRules
}
