import type { LintedMessage, LintedPattern, LintedResource, LintReport } from './context.js';
import { getAllLintReports, hasLintReports } from './query.js';

// TODO: improve output with better layout and coloring

export const print = (resource: LintedResource) => {
	if (!hasLintReports(resource)) return

	const separator = `Resource['${resource.languageTag.name}']`
	console.info(separator)

	const reports = getAllLintReports(resource, false)
	for (const report of reports) {
		printReport(report, 'info')
	}

	for (const message of resource.body) {
		printMessage(message, separator)
	}
}

const printMessage = (message: LintedMessage, prefix: string) => {
	if (!hasLintReports(message)) return

	const separator = `${prefix} -> Message['${message.id.name}']`
	console.info(separator)

	const reports = getAllLintReports(message, false)
	for (const report of reports) {
		printReport(report, 'info')
	}

	printPattern(message.pattern)
}

const printPattern = (pattern: LintedPattern) => {
	if (!hasLintReports(pattern)) return

	const reports = getAllLintReports(pattern, false)
	for (const report of reports) {
		printReport(report, 'info')
	}
}

export const printReport = (report: LintReport, methodOverride?: 'info' | 'warn' | 'error'): void => {
	if (!report) return

	const { id, level, message, metadata } = report
	const method = methodOverride ?? (level === 'error' ? 'error' : 'warn')
	console[method](`[${level}] (${id}) ${message}`, metadata ?? '');
}
