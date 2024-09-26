import type { Expression, FunctionReference } from "@inlang/sdk2"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import {
	escapeForDoubleQuoteString,
	escapeForSingleQuoteString,
} from "../services/codegen/escape.js"
import type { Compiled } from "./types.js"
import { type Registry } from "./registry.js"

export function compileExpression(
	lang: string,
	expression: Expression,
	registry: Registry
): Compiled<Expression> {
	if (expression.annotation) {
		const fn = expression.annotation
		const hasOptions = fn.options.length > 0

		const registryFunction = registry[fn.name]
		if (!registryFunction) {
			throw new Error(`Function ${fn.name} not found in registry`)
		}

		const args = [`"${lang}"`, compileArg(expression.arg)]
		if (hasOptions) {
			const options = compileOptions(fn.options)
			args.push(options.code)
		}

		const code = isValidJSIdentifier(fn.name)
			? `registry.${fn.name}(${args.join(", ")})`
			: `registry["${escapeForDoubleQuoteString(fn.name)}"](${args.join(", ")})`

		return { code, node: expression }
	}
	const code = compileArg(expression.arg)
	return { code, node: expression }
}

function compileOptions(
	options: FunctionReference["options"]
): Compiled<FunctionReference["options"]> {
	const entires: string[] = options.map((option) => `${option.name}: ${compileArg(option.value)}`)
	const code = "{" + entires.join(", ") + "}"

	// TODO Type-Narrowing for options - do we support using inputs as options yet?
	return { code, node: options }
}

function compileArg(arg: Expression["arg"]): string {
	switch (arg.type) {
		case "literal":
			return `"${escapeForDoubleQuoteString(arg.value)}"`
		case "variable-reference": {
			return !isValidJSIdentifier(arg.name)
				? `inputs['${escapeForSingleQuoteString(arg.name)}']`
				: `inputs.${arg.name}`
		}
	}
}
