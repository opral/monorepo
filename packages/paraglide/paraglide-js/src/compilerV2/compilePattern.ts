import type { Pattern } from "@inlang/sdk2"
import { escapeForTemplateLiteral } from "../services/codegen/escape.js"
import { backtick } from "../services/codegen/quotes.js"
import { compileExpression } from "./compileExpression.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"
import type { Registry } from "./registry.js"

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *  const { compiled, params } = compilePattern([{ type: "Text", value: "Hello " }, { type: "VariableReference", name: "name" }])
 *  >> compiled === "`Hello ${params.name}`"
 */
export const compilePattern = (
	lang: string,
	pattern: Pattern,
	registry: Registry
): Compilation<Pattern> => {
	const compiledPatternElements = pattern.map((element): Compilation<Pattern[number]> => {
		switch (element.type) {
			case "text":
				return {
					code: escapeForTemplateLiteral(element.value),
					typeRestrictions: {},
					source: element,
				}
			case "expression": {
				const compiledExpression = compileExpression(lang, element, registry)
				const code = "${" + compiledExpression.code + "}"
				return { code, typeRestrictions: compiledExpression.typeRestrictions, source: element }
			}
		}
	})
	const code = backtick(compiledPatternElements.map((res) => res.code).join(""))

	const typeRestrictions: Record<string, string> = compiledPatternElements
		.map((el) => el.typeRestrictions)
		.reduce(mergeTypeRestrictions, {})

	return { code, typeRestrictions, source: pattern }
}
