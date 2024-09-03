import type { MessageNested, Variant } from "@inlang/sdk2"

import { compilePattern } from "./compilePattern.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { compileExpression } from "./compileExpression.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"
import { inputsType } from "./inputsType.js"
import { jsIdentifier } from "~/services/codegen/identifier.js"

/**
 * Returns the compiled message as a string
 *
 * @example
 * @param message The message to compile
 * @returns (inputs) => string
 */
export const compileMessage = (message: MessageNested): Compilation<MessageNested> => {
	// return empty string instead?
	if (message.variants.length == 0) throw new Error("Message must have at least one variant")
	const hasMultipleVariants = message.variants.length > 1
	return addTypes(
		hasMultipleVariants
			? compileMessageWithMultipleVariants(message)
			: compileMessageWithOneVariant(message)
	)
}

function compileMessageWithOneVariant(message: MessageNested): Compilation<MessageNested> {
	const variant = message.variants[0]
	if (!variant || message.variants.length !== 1)
		throw new Error("Message must have exactly one variant")
	const hasInputs = message.declarations.some((decl) => decl.type === "input")
	const compiledPattern = compilePattern(message.locale, variant.pattern)
	const code = `const ${jsIdentifier(message.id)} = (${hasInputs ? "inputs" : ""}) => ${compiledPattern.code}`
	return { code, typeRestrictions: compiledPattern.typeRestrictions, source: message }
}

function compileMessageWithMultipleVariants(message: MessageNested): Compilation<MessageNested> {
	if (message.variants.length <= 1) throw new Error("Message must have more than one variant")
	const hasInputs = message.declarations.some((decl) => decl.type === "input")

	const compiledSelectors = message.selectors.map((selector) =>
		compileExpression(message.locale, selector)
	)

	const selectorCode = `const selectors = [ ${compiledSelectors
		.map((sel) => sel.code)
		.join(", ")} ]`

	const compiledVariants = message.variants.map((variant): Compilation<Variant> => {
		const compiledPattern = compilePattern(message.locale, variant.pattern)
		const typeRestrictions = compiledPattern.typeRestrictions

		const allWildcards: boolean = Object.values(variant.match).every((m: string) => m === "*")
		if (allWildcards)
			return { code: `return ${compiledPattern.code}`, typeRestrictions, source: variant }

		const conditions: string[] = []
		// TODO @samuelstroschein seems like paraglide is not yet aware of the matching record and bases on indexes for matching
		// 	const conditions: string[] = (variant.match as string[])
		// .filter((m) => m !== "*")
		// .map((m, i) => `selectors[${i}] === "${escapeForDoubleQuoteString(m)}"`)

		return {
			code: `if (${conditions.join(" && ")}) return ${compiledPattern.code}`,
			typeRestrictions,
			source: variant,
		}
	})

	const tr = [
		...compiledVariants.map((v) => v.typeRestrictions),
		...compiledSelectors.map((v) => v.typeRestrictions),
	].reduce(mergeTypeRestrictions, {})

	const code = `const ${jsIdentifier(message.id)} = (${hasInputs ? "inputs" : ""}) => {
	${selectorCode}
	${compiledVariants.map((l) => `\t${l.code}`).join("\n")}
}`

	return { code, typeRestrictions: tr, source: message }
}

function addTypes(compilation: Compilation<MessageNested>): Compilation<MessageNested> {
	// add types for the inputs
	const tr = structuredClone(compilation.typeRestrictions)
	for (const decl of compilation.source.declarations) {
		const name = decl.value.arg.name
		if (name in tr) continue
		tr[name] = "NonNullable<unknown>"
	}

	const code = `/**
 * ${inputsType(tr, false)}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
${compilation.code}`

	return {
		...compilation,
		typeRestrictions: tr,
		code,
	}
}
