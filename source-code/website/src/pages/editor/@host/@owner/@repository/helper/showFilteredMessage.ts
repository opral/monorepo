import type { LintReport, Message } from "@inlang/app"
import { useEditorState } from "../State.jsx"
export const showFilteredMessage = (message: Message | undefined) => {
	const { filteredLintRules, filteredLanguageTags, filteredId, textSearch, inlang } =
		useEditorState()

	// Early exit if variants are empty
	if (!message?.variants.length) {
		return false
	}

	const languageTagsSet = new Set(filteredLanguageTags())
	const lintRulesSet = new Set(filteredLintRules())
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
			}),
		)
		.join("")

	// filteredByLanguage
	const filteredByLanguage = {
		...message,
		variants: message.variants.filter(
			(variant) => languageTagsSet.size === 0 || languageTagsSet.has(variant.languageTag),
		),
	}

	// filteredById
	const filteredById =
		filteredId() === "" || (message !== undefined && message.id === filteredId())
			? filteredByLanguage
			: false

	// filteredBySearch
	const filteredBySearch =
		searchLower.length === 0 ||
		(message !== undefined &&
			(message.id.toLowerCase().includes(searchLower) || patternsLower.includes(searchLower)))
			? filteredById
			: false

	// filteredByLintRules
	const filteredByLintRules =
		lintRulesSet.size === 0 ||
		(message !== undefined &&
			inlang()
				?.lint.reports()
				.some(
					(report: LintReport) =>
						lintRulesSet.has(report.ruleId) &&
						languageTagsSet.has(report.languageTag) &&
						report.messageId === message.id,
				))
			? filteredBySearch
			: false

	return filteredByLintRules
}