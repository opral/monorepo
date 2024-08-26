import type { Expression, FunctionAnnotation } from "@inlang/sdk2"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import {
	escapeForDoubleQuoteString,
	escapeForSingleQuoteString,
} from "../services/codegen/escape.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"
import { type Registry } from "./registry.js"

export function compileExpression(
	lang: string,
	expression: Expression,
	registry: Registry
): Compilation<Expression> {
	if (expression.annotation) {
		const fn = expression.annotation
		const hasOptions = fn.options.length > 0

		let typeRestrictions: Record<string, string> = {}

		const registryFunction = registry[fn.name]
		if (!registryFunction) {
			throw new Error(`Function ${fn.name} not found in registry`)
		}

		if (registryFunction.typeRestriction && expression.arg.type === "variable") {
			typeRestrictions[expression.arg.name] = registryFunction.typeRestriction
		}

		const args = [`"${lang}"`, compileArg(expression.arg)]
		if (hasOptions) {
			const options = compileOptions(fn.options, registryFunction)
			args.push(options.code)
			typeRestrictions = mergeTypeRestrictions(typeRestrictions, options.typeRestrictions)
		}

		const code = isValidJSIdentifier(fn.name)
			? `registry.${fn.name}(${args.join(", ")})`
			: `registry["${escapeForDoubleQuoteString(fn.name)}"](${args.join(", ")})`

		return { code, typeRestrictions, source: expression }
	}
	const code = compileArg(expression.arg)
	return { code, typeRestrictions: {}, source: expression }
}

function compileOptions(
	options: FunctionAnnotation["options"],
	registryFn: Registry[string]
): Compilation<FunctionAnnotation["options"]> {
	const entires: string[] = options.map((option) => `${option.name}: ${compileArg(option.value)}`)
	const code = "{" + entires.join(", ") + "}"

	// TODO Type-Narrowing for options - do we support using inputs as options yet?
	return { code, typeRestrictions: {}, source: options }
}

function compileArg(arg: Expression["arg"]): string {
	switch (arg.type) {
		case "literal":
			return `"${escapeForDoubleQuoteString(arg.name)}"`
		case "variable": {
			return !isValidJSIdentifier(arg.name)
				? `inputs['${escapeForSingleQuoteString(arg.name)}']`
				: `inputs.${arg.name}`
		}
	}
}
