import type { Resource, Message, Pattern } from "../ast/schema.js"
import type { Pretty } from "../utilities/types.js"
import type { LintableNode, LintConfigArguments, LintRuleId } from "./rule.js"

export type LintLevel = "error" | "warn"

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

export type LintedResource = Pretty<Resource<Extension>>
export type LintedMessage = Pretty<Message<Extension>>
export type LintedPattern = Pretty<Pattern<Extension>>

export type LintedNode = LintedResource | LintedMessage | LintedPattern

/**
 * The context provides utility functions for a lint rule.
 */
export type Context = {
	report: (information: { node: LintableNode; message: string; metadata?: unknown }) => void
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
): { level: false | LintLevel; settings: T | undefined } => {
	const [parsedLevel, settings] = args || []

	const level = parsedLevel === undefined || parsedLevel === true ? defaultLevel : parsedLevel

	return {
		level,
		settings,
	}
}

export const createContext = (id: LintRuleId, level: LintLevel) =>
	({
		report: ({ node, message, metadata }) => {
			if (!node) return

			node.lint = [
				...((node as LintedNode).lint || []),
				{
					id,
					level,
					message,
					...(metadata ? { metadata } : undefined),
				} satisfies LintReport,
			]
		},
	} satisfies Context)
