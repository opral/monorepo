import type { LintedNode, LintLevel, LintReport } from "./context.js"
import type { LintableNode, LintRuleId } from "./rule.js"

/**
 * Creates a function that can be used to report lint issues.
 */
export const createReportFunction = (_args: { id: LintRuleId; level: LintLevel }) => {
	return (args: { node: LintableNode; message: string }) => {
		if (!args.node) return

		args.node.lint = [
			...((args.node as LintedNode).lint ?? []),
			{
				id: _args.id,
				level: _args.level,
				...args,
			} satisfies LintReport,
		]
	}
}
