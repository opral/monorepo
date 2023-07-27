import type { InlangConfig } from "@inlang/core/config"
import type * as ast from "@inlang/core/ast"
import type { LintReport } from "./rule.js"

class ExceptionDuringLinting extends Error {
	readonly #id = "ExceptionDuringLinting"
}

/**
 * Lints the given resources.
 *
 * The linted resources will be returned with lint information added to each node.
 * The returned errors are unexpected errors that occurred during linting, not
 * lint errors themselves.
 *
 * @example
 *   const lints = await lint({ config, resources })
 *   if (lints.exceptions) {
 *     // handle unexpected errors during the linting process.
 *     // this errors are not lint errors themselves!
 *   }
 *   lints.reports
 */
export const lint = async (args: {
	config: Pick<InlangConfig, "lint" | "languageTags" | "sourceLanguageTag">
	messages: ast.Message[]
}): Promise<{ reports: LintReport[]; exceptions?: ExceptionDuringLinting[] }> => {
	if (args.config.lint === undefined || args.config.lint.rules.length === 0) {
		return { reports: [], exceptions: undefined }
	}
	const reports: LintReport[] = []
	const exceptions: ExceptionDuringLinting[] = []

	for (const message of args.messages) {
		for (const rule of args.config.lint.rules.flat()) {
			try {
				const clone = structuredClone(message)
				const report = await rule.message({
					message: clone,
					messages: args.messages,
					config: args.config,
				})
				if (report !== undefined) {
					const fullReport = { ...report, ruleId: rule.id, level: rule.level } satisfies LintReport
					reports.push(fullReport)
				}
			} catch (e) {
				exceptions.push(
					new ExceptionDuringLinting(`Exception in lint rule '${rule.id}'`, {
						cause: e,
					}),
				)
			}
		}
	}

	return { reports, exceptions: exceptions.length > 0 ? exceptions : undefined }
}
