import type { Resource, Message, Pattern } from "../ast/schema.js"
import type { Pretty } from "../utilities/types.js"
import type { LintableNode, LintConfigArguments, LintRuleId } from "./rule.js"

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

/**
 * An utility function to parse the arguments passed to a lint rule. It will extract the lint rule and the rule specific settings.
 *
 * @param args the settings object pass
 * @param defaultLevel the fallback lint level that get's used when no lint level is specified
 * @returns the extracted information from the passed arguments
 */
export const parseLintConfigArguments = <T>(
	args: LintConfigArguments<T> | undefined,
	defaultLevel: LintLevel,
): { level: LintLevel; settings: T | undefined } => {
	const [parsedLevel, settings] = args || []

	const level = parsedLevel === undefined || parsedLevel === true ? defaultLevel : parsedLevel

	return {
		level,
		settings,
	}
}
