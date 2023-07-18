import type { BCP47LanguageTag } from "@inlang/core/languageTag"
import type { LintReport } from "@inlang/core/lint"

export const handleMissingMessage = (
	report: LintReport,
	filteredLanguageTags: BCP47LanguageTag[],
) => {
	if (!report.id.includes("missingMessage")) {
		return true
	} else {
		const lintLanguage = report.message.match(/'([^']+)'/g)
		if (lintLanguage?.length === 2) {
			if (
				filteredLanguageTags.includes(lintLanguage[1]!.replace(/'/g, "")) ||
				filteredLanguageTags.length === 0
			) {
				return true
			}
		} else {
			return true
		}
	}
	return false
}
