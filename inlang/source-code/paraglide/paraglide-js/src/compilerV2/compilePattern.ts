import type { Pattern } from "@inlang/sdk/v2"
import { escapeForTemplateLiteral } from "../services/codegen/escape.js"
import { backtick } from "../services/codegen/quotes.js"
import { compileExpression } from "./compileExpression.js"

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *  const { compiled, params } = compilePattern([{ type: "Text", value: "Hello " }, { type: "VariableReference", name: "name" }])
 *  >> compiled === "`Hello ${params.name}`"
 */
export const compilePattern = (
	pattern: Pattern
): {
	inputs: Record<string, "NonNullable<unknown>">
	compiled: string
} => {
	const inputs: Record<string, "NonNullable<unknown>"> = {}
	const compiled = backtick(
		pattern
			.map((element) => {
				switch (element.type) {
					case "text":
						return escapeForTemplateLiteral(element.value)
					case "expression":
						return "${" + compileExpression(element) + "}"
				}
			})
			.join("")
	)

	return { inputs, compiled }
}
