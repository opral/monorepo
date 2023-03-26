import type { LintableNode, LintReport, LintRule, LintedNode } from "./rule.js"

/**
 * Creates a function that can be used to report lint issues.
 */
export const createReportFunction = (_args: { id: LintRule["id"]; level: LintRule["level"] }) => {
	return (args: { node: LintableNode; message: string }) => {
		if (!args.node) return

		args.node.lint = [
			// copy existing lint reports
			...((args.node as LintedNode).lint ?? []),
			// add the new lint report to the node
			{
				id: _args.id,
				level: _args.level,
				message: args.message,
			} satisfies LintReport,
		]
	}
}
