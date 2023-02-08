import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'

type MaybePromise<T> = T | Promise<T>

type LintLevel = 'error' | 'warning'

type LintConfig<Config = Record<string, unknown>> = {
	[Key in keyof Config]?: false | LintLevel | Config[Key]
}

export type LintRuleInit<Config extends Record<string, unknown> | undefined = undefined> =
	(...options: [undefined extends Config ? never : LintConfig<Config>]) => LintRule

export type LintableNode =
	| Resource
	| Message
	| Pattern

type NodeVisitor<Node extends LintableNode> = {
	before?: (...[target, reference]: TargetReferenceParameterTuple<Node>) => MaybePromise<'skip' | void>
	lint?: (...[target, reference]: TargetReferenceParameterTuple<Node>) => MaybePromise<void>
	after?: (...[target, reference]: TargetReferenceParameterTuple<Node>) => MaybePromise<void>
}

export type LintRule = {
	id: string
	initialize?: (config: Pick<Config, 'referenceLanguage' | 'languages'>) => MaybePromise<unknown>
	visit: {
		[Key in LintableNode['type']]?: NodeVisitor<GetByType<LintableNode, Key>>
	},
	teardown?: () => MaybePromise<void>
}

type GetByType<Node extends { type: string }, Key> = Node extends { type: Key } ? Node : never

export type TargetReferenceParameterTuple<Node extends LintableNode> =
	| [Node, Node]
	| [Node, Node | undefined]
	| [Node | undefined, Node]
