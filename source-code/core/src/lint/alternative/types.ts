import type * as ast from "@inlang/core/ast"
import type { Config } from "../../config/schema.js"
import type { createReportFunction } from "./report.js"

/**
 * Type for the function that creates a lint rule.
 * @example
 * const createLintRule: CreateLintRuleFunction = (args, fn) => {
 *   // Implement the lint rule creation logic
 * };
 */
export type CreateLintRuleFunction = (
	args: { id: LintRule["id"] },
	setup: (
		args: Parameters<LintRule["setup"]>[0] & {
			settings: any
		},
	) => ReturnType<LintRule["setup"]>,
) => ConfigureLintRuleFunction

/**
 * Type for the function that configures a lint rule.
 *
 * @example
 * const configureLintRule: ConfigureLintRuleFunction = (level, settings) => {
 *   // Implement the lint rule configuration logic
 * };
 */
export type ConfigureLintRuleFunction = (level: LintRule["level"], settings?: any) => LintRule

/**
 * A lint rule that was configured with the lint level and lint specific settings.
 */
export type LintRule = {
	id: `${string}.${string}`
	level: "error" | "warn"
	setup: (args: {
		config: Pick<Config, "referenceLanguage" | "languages">
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

export type LintedResource = ast.Resource<LintExtension>
export type LintedMessage = ast.Message<LintExtension>
export type LintedPattern = ast.Pattern<LintExtension>

export type LintedNode = LintedResource | LintedMessage | LintedPattern

type MaybePromise<T> = T | Promise<T>
