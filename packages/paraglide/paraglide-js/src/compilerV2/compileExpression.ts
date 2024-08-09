import type { Expression, FunctionAnnotation } from "@inlang/sdk2"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import {
	escapeForDoubleQuoteString,
	escapeForSingleQuoteString,
} from "../services/codegen/escape.js"

export function compileExpression(lang: string, expression: Expression): string {
	if (expression.annotation) {
		const fn = expression.annotation
		const hasOptions = fn.options.length > 0

		const args = [`"${lang}"`, compileArg(expression.arg)]
		if (hasOptions) args.push(compileOptions(fn.options))

		return `registry.${fn.name}(${args.join(", ")})`
	}
	return compileArg(expression.arg)
}

function compileOptions(options: FunctionAnnotation["options"]): string {
	const entires: string[] = options.map((option) => `${option.name}: ${compileArg(option.value)}`)
	return "{ " + entires.join(", ") + " }"
}

function compileArg(arg: Expression["arg"]): string {
	switch (arg.type) {
		case "literal":
			return `"${escapeForDoubleQuoteString(arg.name)}"`
		case "variable": {
			const escaped = !isValidJSIdentifier(arg.name)
			return escaped ? `inputs['${escapeForSingleQuoteString(arg.name)}']` : `inputs.${arg.name}`
		}
	}
}
