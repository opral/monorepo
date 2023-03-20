import type { Message, Pattern, Resource } from "../ast/index.js"
import type { Config } from "../config/schema.js"
import type { MaybePromise } from "../utilities/types.js"
import { LintLevel, parseLintConfigArguments, Context } from "./context.js"

export type LintableNode = Resource | Message | Pattern

export type LintableNodeByType<Node extends { type: string }, Key> = Node extends { type: Key }
	? Node
	: never

export type TargetReferenceParameterTuple<Node extends LintableNode> =
	| { target: Node; reference: Node }
	| { target: Node; reference: Node | undefined }
	| { target: Node | undefined; reference: Node }

type VisitorParam<Node extends LintableNode, Input> = TargetReferenceParameterTuple<Node> & {
	payload?: Input
}

export type EnterNodeFunction<Node extends LintableNode, Input, Output> = (
	param: VisitorParam<Node, Input>,
) => MaybePromise<"skip" | void | Output>

export type LeaveNodeFunction<Node extends LintableNode, Input> = (
	param: VisitorParam<Node, Input>,
) => MaybePromise<"skip" | void>

export type NodeVisitor<Node extends LintableNode> =
	| EnterNodeFunction<Node, any, any>
	| {
			enter?: EnterNodeFunction<Node, any, any>
			leave?: LeaveNodeFunction<Node, any>
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
	setup: (
		param: Pick<Config, "referenceLanguage" | "languages"> & {
			context: Context
		},
	) => MaybePromise<unknown>
	visitors: NodeVisitors
	teardown?: (param: { payload: unknown }) => MaybePromise<void>
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
	configureLintRule: (settings?: Settings) => Omit<LintRule, "id" | "level">,
) =>
	((...args) => {
		const { level, settings } = parseLintConfigArguments<Settings>(args, defaultLevel)

		return {
			...configureLintRule(settings),
			id,
			level,
		}
	}) satisfies LintRuleInitializer<Settings, RequireSettings>
