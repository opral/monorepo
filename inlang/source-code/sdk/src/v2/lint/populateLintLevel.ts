import type { LintConfig, LintReport } from "../types/lint.js"

/**
 * Figures out which level a lint report should have.
 *
 * @param report - The lint report without a level
 * @param lintReportConfigs - The lint report configs in the project - sorted by priority
 * @returns - The lint report with a level
 */
export function populateLevel(
	report: Omit<LintReport, "level">,
	lintReportConfigs: Iterable<LintConfig>
): LintReport {
	// for now we assume that reports are sorted by priority
	for (const config of lintReportConfigs) {
		if (!configMatches(report, config)) continue
		return { ...report, level: config.level }
	}

	return { ...report, level: "error" }
}

function configMatches(report: Omit<LintReport, "level">, config: LintConfig): boolean {
	if (config.ruleId !== report.ruleId) return false
	if (config.bundleId !== report.target.messageBundleId) return false
	if (config.messageId !== report.target.messageId) return false
	if (config.variantId !== report.target.variantId) return false
	return true
}
