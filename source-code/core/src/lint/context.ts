import type { Resource, Message, Pattern } from "../ast/schema.js"
import type { Pretty } from "../utilities/types.js"
import type { LintableNode, LintRuleId } from "./rule.js"

export type LintLevel = "error" | "warn"

export type LintReport = {
	id: LintRuleId
	level: LintLevel
	message: string
}

type LintInformation = {
	lint?: LintReport[]
}

type Extension = {
	Resource: LintInformation
	Message: LintInformation
	Pattern: LintInformation
}

export type LintedResource = Pretty<Resource<Extension>>
export type LintedMessage = Pretty<Message<Extension>>
export type LintedPattern = Pretty<Pattern<Extension>>

export type LintedNode = LintedResource | LintedMessage | LintedPattern

/**
 * The context provides utility functions for a lint rule.
 */
export type Context = {
	target?: LintableNode
	reference?: LintableNode
	referenceLanguage: string
	languages: string[]
}
