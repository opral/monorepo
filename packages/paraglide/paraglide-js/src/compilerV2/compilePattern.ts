import type { Expression, FunctionAnnotation, Pattern } from "@inlang/sdk/v2"
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
			case "text":
				result += escapeForTemplateLiteral(element.value)
				break
			case "expression":
				result += "${" + compileExpression(element) + "}"
				break
		}
	}
	return {
		params,
		compiled: backtick(result),
	}
}

function compileExpression(expression: Expression): string {
	if (expression.annotation) {
		const fn = expression.annotation
		return `${fn.name}(${compileArg(expression.arg)}, ${compileOptions(fn.options)})`
	} else {
		return compileArg(expression.arg)
	}
}

function compileOptions(options: FunctionAnnotation["options"]): string {
	const entires: string[] = options.map((option) => `${option.name}: ${compileArg(option.value)}`)
	return "{ " + entires.join(", ") + " }"
}

function compileArg(arg: Expression["arg"]): string {
	switch (arg.type) {
		case "literal":
			return `"${arg.value}"`
		case "variable": {
			const escaped = !isValidJSIdentifier(arg.name)
			return escaped ? `params['${escapeForSingleQuoteString(arg.name)}']` : `params.${arg.name}`
		}
	}
}
