import type { Expression, FunctionAnnotation } from "@inlang/sdk/v2"
import { isValidJSIdentifier } from "../services/valid-js-identifier"
import { escapeForDoubleQuoteString, escapeForSingleQuoteString } from "../services/codegen/escape"

export function compileExpression(expression: Expression): string {
	if (expression.annotation) {
		const fn = expression.annotation

		if (fn.options.length === 0) return `registry.${fn.name}(${compileArg(expression.arg)})`
		else return `registry.${fn.name}(${compileArg(expression.arg)}, ${compileOptions(fn.options)})`
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
			return `"${escapeForDoubleQuoteString(arg.value)}"`
		case "variable": {
			const escaped = !isValidJSIdentifier(arg.name)
			return escaped ? `inputs['${escapeForSingleQuoteString(arg.name)}']` : `inputs.${arg.name}`
		}
	}
}
