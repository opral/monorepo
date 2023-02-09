import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'

type MaybePromise<T> = T | Promise<T>

// --------------------------------------------------------------------------------------------------------------------

export type LintType = 'error' | 'warning'

export type LintConfigSettings<Settings> = boolean | LintType | Settings

export type LintRuleInit<Settings = never> =
	(settings?: LintConfigSettings<Settings>) => LintRule

// --------------------------------------------------------------------------------------------------------------------

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

// --------------------------------------------------------------------------------------------------------------------

export type Reporter = {
	reportIssue: (node: LintableNode, message: string, metadata?: unknown) => void
}

export type LintRule = {
	id: string
	type: false | LintType
	initialize: (config: Pick<Config, 'referenceLanguage' | 'languages'> & { reporter: Reporter }) => MaybePromise<unknown>
	visitors: {
		[Key in LintableNode['type']]?: NodeVisitor<GetByType<LintableNode, Key>>
	},
	teardown?: (payload: unknown) => MaybePromise<void>
}

type GetByType<Node extends { type: string }, Key> = Node extends { type: Key } ? Node : never

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
