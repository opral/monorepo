import type { LintedMessage, LintedNode, LintedPattern, LintedResource, LintLevel, LintResult } from './schema.js';
import { unhandled } from './_utilities.js';

export const getAllLintReports = (node: LintedNode, nested = true): LintResult[] => {
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

const getAllLintReportsFromResource = ({ lint, body }: LintedResource, nested: boolean): LintResult[] =>
	[
		...(lint || []),
		...(nested
			? body.flatMap(message => getAllLintReports(message, nested))
			: []
		)
	]

const getAllLintReportsFromMessage = ({ lint, pattern }: LintedMessage, nested: boolean): LintResult[] =>
	[
		...(lint || []),
		...(nested
			? getAllLintReports(pattern)
			: []
		)
	]

const getAllLintReportsFromPattern = ({ lint }: LintedPattern): LintResult[] =>
	[...(lint || [])]

// --------------------------------------------------------------------------------------------------------------------

export const getAllLintReportsByLevel = (level: LintLevel, node: LintedNode, nested = true): LintResult[] =>
	getAllLintReports(node, nested)
		.filter(report => report.level === level)

export const getAllLintErrors = getAllLintReportsByLevel.bind(undefined, 'error')

export const getAllLintWarnings = getAllLintReportsByLevel.bind(undefined, 'warning')

// --------------------------------------------------------------------------------------------------------------------

export const getAllLintReportsById = (id: string, node: LintedNode, nested = true): LintResult[] =>
	getAllLintReports(node, nested)
		.filter(report => report.id === id)

export const getAllLintErrorsWithId = (id: string, node: LintedNode, nested = true): LintResult[] =>
	getAllLintReportsById(id, node, nested)
		.filter(report => report.level === 'error')

export const getAllLintWarningsWithId = (id: string, node: LintedNode, nested = true): LintResult[] =>
	getAllLintReportsById(id, node, nested)
		.filter(report => report.level === 'warning')
