import type { Pattern } from "@inlang/sdk2"
import { escapeForTemplateLiteral } from "../services/codegen/escape.js"
import { backtick } from "../services/codegen/quotes.js"
import { compileExpression } from "./compileExpression.js"
import type { Compilation } from "./types.js"

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *  const { compiled, params } = compilePattern([{ type: "Text", value: "Hello " }, { type: "VariableReference", name: "name" }])
 *  >> compiled === "`Hello ${params.name}`"
 */
export const compilePattern = (lang: string, pattern: Pattern): Compilation<Pattern> => {
	const compiledPatternElements = pattern.map((element): Compilation<Pattern[number]> => {
		switch (element.type) {
			case "text":
				return {
					code: escapeForTemplateLiteral(element.value),
					typeRestrictions: {},
					source: element,
				}
			case "expression": {
				const compiledExpression = compileExpression(lang, element)
				const code = "${" + compiledExpression.code + "}"
				return { code, typeRestrictions: compiledExpression.typeRestrictions, source: element }
			}
		}
	})
	const code = backtick(compiledPatternElements.map((res) => res.code).join(""))

	const typeRestrictions: Record<string, string> = {}
	return { code, typeRestrictions, source: pattern }
}
