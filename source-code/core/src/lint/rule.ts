import type { InlangConfig } from "../config/index.js"
import type * as ast from "../ast/index.js"
import type { createReportFunction } from "./report.js"

/**
 * A lint rule that was configured with the lint level and lint specific settings.
 */
export type LintRule = {
	id: `${string}.${string}`
	level: "error" | "warn"
	setup: (args: {
		config: Pick<InlangConfig, "referenceLanguage" | "languages">
		report: ReturnType<typeof createReportFunction>
	}) => MaybePromise<{
		visitors: Visitors
	}>
}

export type Visitors = {
	Resource?: VisitorFunction<ast.Resource>
	Message?: VisitorFunction<ast.Message>
	Pattern?: VisitorFunction<ast.Pattern>
}

/**
 * A report of a given lint rule.
 */
export type LintReport = {
	id: LintRule["id"]
	level: LintRule["level"]
	message: string
}

/**
 * Nodes that can be linted.
 *
 * The linter will only lint nodes that are of this type.
 */
export type LintableNode = ast.Resource | ast.Message | ast.Pattern

type VisitorFunction<Node extends LintableNode> = (args: {
	reference?: Node
	target?: Node
}) => MaybePromise<void | "skip">

type LintInformation = {
	lint?: LintReport[]
}

type LintExtension = {
	Resource: LintInformation
	Message: LintInformation
	Pattern: LintInformation
}

export type LintedResource = Pretty<ast.Resource<LintExtension>>
export type LintedMessage = Pretty<ast.Message<LintExtension>>
export type LintedPattern = Pretty<ast.Pattern<LintExtension>>

export type LintedNode = LintedResource | LintedMessage | LintedPattern

type MaybePromise<T> = T | Promise<T>

type Pretty<T> = T extends (...args: any[]) => any
	? T
	: T extends abstract new (...args: any[]) => any
	? T
	: { [K in keyof T]: T[K] }
