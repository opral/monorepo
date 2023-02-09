import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { LintRule } from './rule.js'

export type MaybePromise<T> = T | Promise<T>

// --------------------------------------------------------------------------------------------------------------------

export type LintType = 'error' | 'warning'

export type LintConfigSettings<Settings> = boolean | LintType | Settings

export type LintRuleInit<Settings = never> =
	(settings?: LintConfigSettings<Settings>) => LintRule

// --------------------------------------------------------------------------------------------------------------------

export type LintResult = {
	id: `${string}.${string}` // e.g. 'inlangStandardRules.missingKey'
	type: LintType
	message: string
	metadata?: unknown
}

type LintInformation = {
	lint?: LintResult[]
}

type LintedResource = Resource & LintInformation
type LintedMessage = Message & LintInformation
type LintedPattern = Pattern & LintInformation

export type LintedNode = LintedResource | LintedMessage | LintedPattern
