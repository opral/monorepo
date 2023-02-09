import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { LintRule } from './rule.js'

// --------------------------------------------------------------------------------------------------------------------

export type LintLevel = 'error' | 'warning'

export type LintConfigSettings<Settings> = boolean | LintLevel | Settings

export type LintRuleInit<Settings = never> =
	(settings?: LintConfigSettings<Settings>) => LintRule

// --------------------------------------------------------------------------------------------------------------------

export type LintResult = {
	id: `${string}.${string}` // e.g. 'inlangStandardRules.missingKey'
	level: LintLevel
	message: string
	metadata?: unknown
}

type LintInformation = {
	lint?: LintResult[]
}

export type LintedResource = Resource & LintInformation
export type LintedMessage = Message & LintInformation
export type LintedPattern = Pattern & LintInformation

export type LintedNode = LintedResource | LintedMessage | LintedPattern
