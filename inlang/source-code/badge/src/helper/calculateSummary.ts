import type { LanguageTag, MessageLintReport } from "@inlang/sdk"

/**
 * Get the percentage of translated messages.
 *
 */
export function calculateSummary(args: {
	reports: MessageLintReport[]
	languageTags: LanguageTag[]
	messageIds: string[]
}): {
	percentage: number
	errors: number
	warnings: number
	numberOfMissingVariants: number
} {
	// get lintedVariants
	const lintedVariantNumber = args.reports.filter(
		(r) =>
			r.ruleId === "messageLintRule.inlang.missingTranslation" ||
			r.ruleId === "messageLintRule.inlang.emptyPattern"
	).length

	// only works with no specified selectors
	const totalNumberOfVariants = args.languageTags.length * args.messageIds.length

	return {
		percentage: Math.round(100 - (lintedVariantNumber / totalNumberOfVariants) * 100),
		errors: args.reports.filter((r) => r.level === "error").length,
		warnings: args.reports.filter((r) => r.level === "warning").length,
		numberOfMissingVariants: lintedVariantNumber,
	}
}
