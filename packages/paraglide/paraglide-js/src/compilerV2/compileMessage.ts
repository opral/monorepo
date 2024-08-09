import type { Message } from "@inlang/sdk/v2"
import { compilePattern } from "./compilePattern.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { compileExpression } from "./compileExpression.js"

/**
 * Returns the compiled message as a string
 *
 * @example
 * @param message The message to compile
 * @returns (inputs) => string
 */
export const compileMessage = (message: Message): string => {
	if (message.variants.length == 0) throw new Error("Message must have at least one variant")
	const hasMultipleVariants = message.variants.length > 1
	return hasMultipleVariants
		? compileMessageWithMultipleVariants(message)
		: compileMessageWithOneVariant(message)
}

function compileMessageWithOneVariant(message: Message): string {
	if (message.variants.length !== 1) throw new Error("Message must have exactly one variant")
	const hasInputs = message.declarations.some((decl) => decl.type === "input")

	const variant = message.variants[0]
	return `(${hasInputs ? "inputs" : ""}) => ${compilePattern(variant.pattern).compiled}`
}

function compileMessageWithMultipleVariants(message: Message): string {
	if (message.variants.length <= 1) throw new Error("Message must have more than one variant")
	const hasInputs = message.declarations.some((decl) => decl.type === "input")

	const computedSelectors =
		"const selectors = [ " +
		message.selectors.map((selector) => compileExpression(selector)).join(", ") +
		" ]"

	const compiledVariants = message.variants.map((variant) => {
		const allWildcards = variant.match.every((m) => m === "*")
		if (allWildcards) return "return " + compilePattern(variant.pattern).compiled

		const conditions: string[] = []
		for (let i = 0; i < variant.match.length; i++) {
			if (variant.match[i] == "*") continue
			conditions.push(`selectors[${i}] === "${escapeForDoubleQuoteString(variant.match[i])}"`)
		}

		return "if (" + conditions.join(" && ") + ") return " + compilePattern(variant.pattern).compiled
	})

	return `(${hasInputs ? "inputs" : ""}) => {
	${computedSelectors}
${compiledVariants.map((l) => `\t${l}`).join("\n")}
}`
}
