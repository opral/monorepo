import type { Message, Pattern, Resource } from '../ast/index.js';
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import { LintLevel, parseLintSettings, Context } from './context.js';
import type { MaybePromise } from './_utilities.js';

export type LintableNode =
	| Resource
	| Message
	| Pattern

export type LintableNodeByType<Node extends { type: string }, Key> = Node extends { type: Key } ? Node : never

export type TargetReferenceParameterTuple<Node extends LintableNode> =
	| { target: Node, reference: Node }
	| { target: Node, reference: Node | undefined }
	| { target: Node | undefined, reference: Node }

type VisitorParam<Node extends LintableNode, Input> = TargetReferenceParameterTuple<Node> & {
	payload?: Input
}

export type EnterNodeFunction<Node extends LintableNode, Input, Output> =
	(param: VisitorParam<Node, Input>) => MaybePromise<'skip' | void | Output>

export type LeaveNodeFunction<Node extends LintableNode, Input> =
	(param: VisitorParam<Node, Input>) => MaybePromise<'skip' | void>

export type NodeVisitor<Node extends LintableNode> =
	| EnterNodeFunction<Node, any, any>
	| {
		enter?: EnterNodeFunction<Node, any, any>
		leave?: LeaveNodeFunction<Node, any>
	}

export type NodeVisitors = {
	[Key in LintableNode['type']]?: NodeVisitor<LintableNodeByType<LintableNode, Key>>
}

export type LintConfigSettings<Settings> =
	[] | [boolean | LintLevel] | [LintLevel, Settings?]

export type LintRule<Settings = never> =
	(...settings: LintConfigSettings<Settings>) => ConfiguredLintRule

export type LintRuleId = `${string}.${string}` // e.g. 'inlangStandardRules.missingKey'

export type ConfiguredLintRule = {
	id: LintRuleId
	level: false | LintLevel
	initialize: (
		param: Pick<Config, 'referenceLanguage' | 'languages'> & {
			env: EnvironmentFunctions,
			context: Context
		}
	) => MaybePromise<unknown>
	visitors: NodeVisitors
	teardown?: (param: { payload: unknown }) => MaybePromise<void>
}

export const createRule = <Settings>(
	id: LintRuleId,
	defaultLevel: LintLevel,
	configureLintRule: (settings?: Settings) => Omit<ConfiguredLintRule, 'id' | 'level'>
) =>
	((...settings) => {
		const { level, options } = parseLintSettings(settings, defaultLevel)

		return {
			...configureLintRule(options),
			id,
			level,
		}
	}) satisfies LintRule<Settings>
