import type { LintedMessage, LintedPattern, LintedResource, LintReport } from "./rule.js"
import { getLintReports, hasLintReports } from "./query.js"

export const print = (resource: LintedResource) => {
	if (!hasLintReports(resource)) return

	const separator = `Resource['${resource.languageTag.name}']`
	console.info(separator)

	const reports = getLintReports(resource, { recursive: false })
	for (const report of reports) {
		printReport(report, "info")
	}

	for (const message of resource.body) {
		printMessage(message, separator)
	}
}

const printMessage = (message: LintedMessage, prefix: string) => {
	if (!hasLintReports(message)) return

	const separator = `${prefix} -> Message['${message.id.name}']`
	console.info(separator)

	const reports = getLintReports(message, { recursive: false })
	for (const report of reports) {
		printReport(report, "info")
	}

	printPattern(message.pattern)
}

const printPattern = (pattern: LintedPattern) => {
	if (!hasLintReports(pattern)) return

	const reports = getLintReports(pattern, { recursive: false })
	for (const report of reports) {
		printReport(report, "info")
	}
}

export const printReport = (
	report: LintReport,
	methodOverride?: "info" | "warn" | "error",
): void => {
	if (!report) return

	const { id, level, message } = report
	const method = methodOverride ?? (level === "error" ? "error" : "warn")
	console[method](`[${level}] (${id}) ${message}`)
}
