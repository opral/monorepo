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

// TODO SDK-v2 LINT loris - discuss how we want this to be implemented
// const keys = [
// 	["ruleId", "ruleId"],
// 	["bundleId", "bundleId"],
// 	["messageId", "messageId"],
// 	["variantId", "variantId"], // ["messageLocale"], // , "locale"],
// 	// ,
// ] as const satisfies [keyof LintConfig, keyof LintReport][]

function configMatches(report: Omit<LintReport, "level">, config: LintConfig): boolean {
	// TODO SDK-v2 LINT loris - discuss how we want this to be implemented
	// for (const [configKey, reportKey] of keys) {
	// 	if (config[configKey] === undefined) continue
	// 	if (config[configKey] !== report[reportKey]) return false
	// }

	return true
}
