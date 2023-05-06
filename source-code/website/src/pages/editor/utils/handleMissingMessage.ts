import type { LintReport } from "@inlang/core/lint"

export const handleMissingMessage = (report: LintReport, filteredLanguages: string[]) => {
	if (!report.id.includes("missingMessage")) {
		return true
	} else {
		const lintLanguage = report.message.match(/'([^']+)'/g)
		if (lintLanguage?.length === 2) {
			if (
				filteredLanguages.includes(lintLanguage[1]!.replace(/'/g, "")) ||
				filteredLanguages.length === 0
			) {
				return true
			}
		} else {
			return true
		}
	}
	return false
}
