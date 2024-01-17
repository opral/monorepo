import type { Pattern } from "@inlang/sdk"
import { escapeForTemplateLiteral, escapeForSingleQuoteString } from "../services/codegen/escape.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { backtick } from "../services/codegen/quotes.js"

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
	params: Record<string, "NonNullable<unknown>">
	compiled: string
} => {
	let result = ""
	const params: Record<string, "NonNullable<unknown>"> = {}
	for (const element of pattern) {
		switch (element.type) {
			case "Text":
				result += escapeForTemplateLiteral(element.value)
				break
			case "VariableReference":
				if (isValidJSIdentifier(element.name)) {
					result += "${params." + element.name + "}"
				} else {
					result += "${params['" + escapeForSingleQuoteString(element.name) + "']}"
				}

				params[element.name] = "NonNullable<unknown>"
				break
			default:
				throw new Error("Unknown pattern element type: " + element)
		}
	}
	return {
		params,
		compiled: backtick(result),
	}
}
