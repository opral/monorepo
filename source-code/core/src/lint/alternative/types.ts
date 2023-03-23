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
	callback: (args: {
		config: SubsetOfConfig
		settings: any
		report: ReturnType<typeof createReportFunction>
	}) => Promise<{ visitors: LintRule["visitors"] }>,
) => ConfigureLintRuleFunction

/**
 * Type for the function that configures a lint rule.
 * @example
 * const configureLintRule: ConfigureLintRuleFunction = (level, settings) => {
 *   // Implement the lint rule configuration logic
 * };
 */
export type ConfigureLintRuleFunction = (
	level: LintRule["level"],
	settings?: any,
) => LintRuleSetupFunction

/**
 * Type for the function that sets up a lint rule.
 * @example
 * const setupLintRule: LintRuleSetupFunction = (args) => {
 *   // Implement the lint rule setup logic
 * };
 */
export type LintRuleSetupFunction = (args: { config: SubsetOfConfig }) => Promise<LintRule>

/**
 * A lint rule that was configured with the lint level and lint specific settings.
 */
export type LintRule = {
	id: `${string}.${string}`
	level: "error" | "warn"
	visitors: {
		Resource?: VisitorFunction<ast.Resource>
		Message?: VisitorFunction<ast.Message>
		Pattern?: VisitorFunction<ast.Pattern>
	}
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

export type NodeWithLints = LintableNode & { lint?: LintReport[] }

type VisitorFunction<Node extends LintableNode> = (args: {
	reference: Node
	target: Node
}) => void | "skip"

type SubsetOfConfig = Pick<Config, "referenceLanguage" | "languages">
