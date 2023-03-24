import type { LintableNode, LintReport, LintRule, NodeWithLints } from "./types.js"

/**
 * Creates a function that can be used to report lint issues.
 */
export const createReportFunction = (_args: { id: LintRule["id"]; level: LintRule["level"] }) => {
	return (args: { node: LintableNode; message: string }) => {
		if (!args.node) return

		args.node.lint = [
			...((args.node as NodeWithLints).lint ?? []),
			{
				id: _args.id,
				level: _args.level,
				...args,
			} satisfies LintReport,
		]
	}
}
