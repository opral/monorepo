import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { LintableNode, LintRuleId } from './rule.js'

export type LintLevel = 'error' | 'warning'

export type LintConfigSettings<Settings> = boolean | LintLevel | Settings

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

export type Reporter = {
	report: (node: LintableNode, message: string, metadata?: unknown) => void
}

export const parseLintSettings = <T>(settings: LintConfigSettings<T>, defaultLevel: LintLevel): { level: false | LintLevel, options: T } => {

	const [level, options] = Array.isArray(settings) ? settings : [settings ?? defaultLevel]

	return { level, options }
}

export const createReporter = (id: LintRuleId, level: LintLevel): Reporter => ({
	report: (node: LintableNode, message: string, metadata?: unknown) => {
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
})
