import type { LanguageTag, LintReport, Message } from "@inlang/app"

/**
 * Get the percentage of translated messages.
 *
 */
export function calculateSummary(args: {
	reports: LintReport[]
	languageTags: LanguageTag[]
	messages: Message[]
}): {
	percentage: number
	errors: number
	warnings: number
	numberOfMissingVariants: number
} {
	// get lintedVariants
	const lintedVariantNumber = args.reports.filter(
		(r) =>
			r.ruleId === "inlang.lintRule.missingMessage" || r.ruleId === "inlang.lintRule.emptyPattern",
	).length

	// only works with no specified selectors
	const totalNumberOfVariants = args.languageTags.length * args.messages.length

	return {
		percentage: Math.round(100 - (lintedVariantNumber / totalNumberOfVariants) * 100),
		errors: args.reports.filter((r) => r.level === "error").length,
		warnings: args.reports.filter((r) => r.level === "warning").length,
		numberOfMissingVariants: lintedVariantNumber,
	}
}
