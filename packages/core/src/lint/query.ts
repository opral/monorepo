import type { LintedNode, LintReport, LintedResource, LintedMessage, LintedPattern, LintLevel } from './context.js';
import { unhandled } from './_utilities.js';

export const getAllLintReports = (node: LintedNode, nested = true): LintReport[] => {
	const { type } = node
	switch (type) {
		case 'Resource':
			return getAllLintReportsFromResource(node, nested)
		case 'Message':
			return getAllLintReportsFromMessage(node, nested)
		case 'Pattern':
			return getAllLintReportsFromPattern(node)

		default:
			return unhandled(type)
	}
}

const getAllLintReportsFromResource = ({ lint, body }: LintedResource, nested: boolean): LintReport[] =>
	[
		...(lint || []),
		...(nested
			? body.flatMap(message => getAllLintReports(message, nested))
			: []
		)
	]

const getAllLintReportsFromMessage = ({ lint, pattern }: LintedMessage, nested: boolean): LintReport[] =>
	[
		...(lint || []),
		...(nested
			? getAllLintReports(pattern)
			: []
		)
	]

const getAllLintReportsFromPattern = ({ lint }: LintedPattern): LintReport[] =>
	[...(lint || [])]

// --------------------------------------------------------------------------------------------------------------------

export const getAllLintReportsByLevel = (level: LintLevel, node: LintedNode, nested = true): LintReport[] =>
	getAllLintReports(node, nested)
		.filter(report => report.level === level)

export const getAllLintErrors = getAllLintReportsByLevel.bind(undefined, 'error')

export const getAllLintWarnings = getAllLintReportsByLevel.bind(undefined, 'warning')

// --------------------------------------------------------------------------------------------------------------------

export const getAllLintReportsWithId = (id: string, node: LintedNode, nested = true): LintReport[] =>
	getAllLintReports(node, nested)
		.filter(report => report.id === id)

export const getAllLintErrorsWithId = (id: string, node: LintedNode, nested = true): LintReport[] =>
	getAllLintErrors(node, nested)
		.filter(report => report.id === id)

export const getAllLintWarningsWithId = (id: string, node: LintedNode, nested = true): LintReport[] =>
	getAllLintWarnings(node, nested)
		.filter(report => report.id === id)

// --------------------------------------------------------------------------------------------------------------------

export const hasLintReports = (node: LintedNode, nested = true): boolean =>
	getAllLintReports(node, nested).length > 0

export const hasLintErrors = (node: LintedNode, nested = true): boolean =>
	getAllLintErrors(node, nested).length > 0

export const hasLintWarnings = (node: LintedNode, nested = true): boolean =>
	getAllLintErrors(node, nested).length > 0

export const hasLintReportsWithId = (id: string, node: LintedNode, nested = true): boolean =>
	getAllLintReportsWithId(id, node, nested).length > 0

export const hasLintErrorsWithId = (id: string, node: LintedNode, nested = true): boolean =>
	getAllLintErrorsWithId(id, node, nested).length > 0

export const hasLintWarningsWithId = (id: string, node: LintedNode, nested = true): boolean =>
	getAllLintWarningsWithId(id, node, nested).length > 0
