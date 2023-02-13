import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { LintableNode, LintConfigSettings, LintRuleId } from './rule.js'

export type LintLevel = 'error' | 'warning'

export type LintReport = {
	id: LintRuleId
	level: LintLevel
	message: string
	metadata?: unknown
}

type LintInformation = {
	lint?: LintReport[]
}

export type LintedResource = Resource & LintInformation
export type LintedMessage = Message & LintInformation
export type LintedPattern = Pattern & LintInformation

export type LintedNode = LintedResource | LintedMessage | LintedPattern

export type Context = {
	report: (args: { node: LintableNode, message: string, metadata?: unknown }) => void
}

export const parseLintSettings = <T>(settings: LintConfigSettings<T> | undefined, defaultLevel: LintLevel): { level: false | LintLevel, options: T | undefined } => {
	const [parsedLevel, options] = settings || []

	const level = parsedLevel === undefined || parsedLevel === true
		? defaultLevel
		: parsedLevel

	return {
		level,
		options,
	}
}

export const createContext = (id: LintRuleId, level: LintLevel) => ({
	report: ({ node, message, metadata }) => {
		if (!node) return

		node.lint = [
			...((node as LintedNode).lint || []),
			{
				id,
				level,
				message,
				...(metadata ? { metadata } : undefined)
			} satisfies LintReport
		]
	}
}  satisfies Context)

// TODO: print also the trace to that report
// e.g. Resource['de']->Message['first-message']

export const printReport = (report: LintReport): void => {
	if (!report) return

	const { id, level, message, metadata } = report
	const method = level === 'error' ? 'error' : 'warn'
	console[method](`[${level}] (${id}) ${message}`, metadata ?? '');
}
