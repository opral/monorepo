import type { Message, Pattern, Resource } from '../ast/index.js';
import type { Config } from '../config/schema.js';
import type { Reporter } from './reporter.js';
import type { LintType, MaybePromise } from './schema.js';

export type LintableNode =
	| Resource
	| Message
	| Pattern

export type TargetReferenceParameterTuple<Node extends LintableNode> =
	| { target: Node, reference: Node }
	| { target: Node, reference: Node | undefined }
	| { target: Node | undefined, reference: Node }

type VisitorParam<Node extends LintableNode, Input> = TargetReferenceParameterTuple<Node> & {
	payload?: Input
}

type NodeVisitor<Node extends LintableNode> = {
	enter?: <Input, Output>(param: VisitorParam<Node, Input>) => MaybePromise<'skip' | void | Output>
	leave?: <Input>(param: VisitorParam<Node, Input>) => MaybePromise<void>
}

export type LintRule = {
	id: string
	type: false | LintType
	initialize: (param: Pick<Config, 'referenceLanguage' | 'languages'> & { reporter: Reporter }) => MaybePromise<unknown>
	visitors: {
		[Key in LintableNode['type']]?: NodeVisitor<GetByType<LintableNode, Key>>
	},
	teardown?: (payload: unknown) => MaybePromise<void>
}

type GetByType<Node extends { type: string }, Key> = Node extends { type: Key } ? Node : never

export const getLintRulesFromConfig = (config: Config) => config?.lint?.rules || []
