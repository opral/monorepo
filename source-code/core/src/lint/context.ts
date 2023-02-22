import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { LintableNode, LintConfigSettings, LintRuleId } from './rule.js'

export type LintLevel = 'error' | 'warn'

export type LintReport = {
	id: LintRuleId
	level: LintLevel
	message: string
	metadata?: unknown
}

type LintInformation = {
	lint?: LintReport[]
}

type Extension = {
	Resource: LintInformation
	Message: LintInformation
	Pattern: LintInformation
}

export type LintedResource = Resource<Extension>
export type LintedMessage = Message<Extension>
export type LintedPattern = Pattern<Extension>

export type LintedNode = LintedResource | LintedMessage | LintedPattern

/**
 *
 */
export type Context = {
	report: (args: { node: LintableNode, message: string, metadata?: unknown }) => void
}

/**
 *
 * @param settings
 * @param defaultLevel
 * @returns
 */
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
