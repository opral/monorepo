import type { Message, Pattern, Resource } from "../ast/index.js"
import type { MaybePromise } from "../utilities/types.js"
import { Context, LintLevel, parseLintConfigArguments } from "./context.js"
import { createReportFunction } from "./report.js"

export type LintableNode = Resource | Message | Pattern

export type LintableNodeByType<Node extends { type: string }, Key> = Node extends { type: Key }
	? Node
	: never

export type TargetReferenceParameterTuple<Node extends LintableNode> = {
	target?: Node
	reference?: Node
}

type VisitorParam<Node extends LintableNode> = TargetReferenceParameterTuple<Node> & Context

export type EnterNodeFunction<Node extends LintableNode, Output> = (
	param: VisitorParam<Node>,
) => MaybePromise<"skip" | void | Output>

export type LeaveNodeFunction<Node extends LintableNode> = (
	param: VisitorParam<Node>,
) => MaybePromise<"skip" | void>

export type NodeVisitor<Node extends LintableNode> =
	| EnterNodeFunction<Node, any>
	| {
			enter?: EnterNodeFunction<Node, any>
			leave?: LeaveNodeFunction<Node>
	  }

export type NodeVisitors = {
	[Key in LintableNode["type"]]?: NodeVisitor<LintableNodeByType<LintableNode, Key>>
}

export type LintConfigArguments<
	Settings = never,
	RequireSettings extends boolean = false,
> = RequireSettings extends true
	? [boolean | LintLevel, Settings]
	: [] | [boolean | LintLevel] | [boolean | LintLevel, Settings?]

/**
 * The unique id of a lint rule.
 *
 * @example
 * ```
 * 'inlangStandardRules.missingKey'
 * ```
 */
export type LintRuleId = `${string}.${string}`

/**
 * An utility type to add strong type definitions for a lint rule.
 *
 * @example a rule that does not expects any settings
 * ```
 * const myRule: LintRuleInitializer = // implementation
 * ```
 * @example a rule that accepts settings
 * ```
 * const myRule: LintRuleInitializer<{ strict: boolean }> = // implementation
 * ```
 * @example a rule that requires settings
 * ```
 * const myRule: LintRuleInitializer<{ strict: boolean }, true> = // implementation
 * ```
 */
export type LintRuleInitializer<Settings = never, RequireSettings extends boolean = false> = (
	...args: LintConfigArguments<Settings, RequireSettings>
) => LintRule

/**
 * A lint rule that was configured with the lint level and lint specific settings.
 */
export type LintRule = {
	id: LintRuleId
	level: false | LintLevel
	visitors: NodeVisitors
}

/**
 * An utility function that encapsulates the parsing of the arguments passed to the lint rule.
 *
 * @param id the unique lint id of this lint rule
 * @param defaultLevel the default lint level this rule should have
 * @param configureLintRule a callback function that get passed the arguments and need to return rule specific implementation details
 * @returns a lint rule
 *
 * @example
 * ```
 * const myRule = createLintRule<{ strict: boolean }>('my.rule', 'error', (settings) => {
 *    return {
 * 		setup: () => {
 * 			if (settings?.strict) return { token: '123' }
 *
 * 			return { token: '456' }
 * 		},
 * 		visitors: {}
 * 	}
 * })
 * ```
 */
export const createLintRule = <Settings = never, RequireSettings extends boolean = false>(
	id: LintRuleId,
	defaultLevel: LintLevel,
	configureLintRule: (args: {
		settings?: Settings
		report: ReturnType<typeof createReportFunction>
	}) => Omit<LintRule, "id" | "level">,
) =>
	((...args) => {
		const { level, settings } = parseLintConfigArguments<Settings>(args, defaultLevel)
		// if the level is false, the rule is disabled
		if (level === false) return { id, level, visitors: {} }

		const report = createReportFunction({ id, level })
		return {
			...configureLintRule({ settings, report }),
			id,
			level,
		}
	}) satisfies LintRuleInitializer<Settings, RequireSettings>
