import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'

type MaybePromise<T> = T | Promise<T>

export type LintType = 'error' | 'warning'

type LintConfig<Config = Record<string, unknown>> = {
	[Key in keyof Config]?: false | LintType | Config[Key]
}

export type LintRuleInit<Config extends Record<string, unknown> | undefined = undefined> =
	(...options: [undefined extends Config ? never : LintConfig<Config>]) => LintRule

export type LintableNode =
	| Resource
	| Message
	| Pattern

type NodeVisitor<Node extends LintableNode> = {
	enter?: (
		...[target, reference, payload]: [...TargetReferenceParameterTuple<Node>, unknown]) => MaybePromise<'skip' | void | unknown>
	leave?: (...[target, reference, payload]: [...TargetReferenceParameterTuple<Node>, unknown]) => MaybePromise<void | unknown>
}

export type Reporter = {
	reportError: (node: LintableNode | undefined, message: string, metadata?: unknown) => void
	reportWarning: (node: LintableNode | undefined, message: string, metadata?: unknown) => void
}


export type LintRule = {
	id: string
	initialize: (config: Pick<Config, 'referenceLanguage' | 'languages'> & { reporter: Reporter }) => MaybePromise<unknown>
	visitors: {
		[Key in LintableNode['type']]?: NodeVisitor<GetByType<LintableNode, Key>>
	},
	teardown?: (payload: unknown) => MaybePromise<void>
}

type GetByType<Node extends { type: string }, Key> = Node extends { type: Key } ? Node : never

export type TargetReferenceParameterTuple<Node extends LintableNode> =
	| [Node, Node]
	| [Node, Node | undefined]
	| [Node | undefined, Node]

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