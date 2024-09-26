import type { MessageNested, Variant } from "@inlang/sdk2"
import type { Registry } from "./registry.js"
import { compilePattern } from "./compilePattern.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"
import { jsIdentifier } from "~/services/codegen/identifier.js"

/**
 * Returns the compiled message as a string
 *
 * @example
 * @param message The message to compile
 * @returns (inputs) => string
 */
export const compileMessage = (
	message: MessageNested,
	registry: Registry
): Compilation<MessageNested> => {
	// return empty string instead?
	if (message.variants.length == 0) throw new Error("Message must have at least one variant")
	const hasMultipleVariants = message.variants.length > 1
	return hasMultipleVariants
		? compileMessageWithMultipleVariants(message, registry)
		: compileMessageWithOneVariant(message, registry)
}

function compileMessageWithOneVariant(
	message: MessageNested,
	registry: Registry
): Compilation<MessageNested> {
	const variant = message.variants[0]
	if (!variant || message.variants.length !== 1) {
		throw new Error("Message must have exactly one variant")
	}
	// TODO implement inputs
	const hasInputs = false
	const compiledPattern = compilePattern(message.locale, variant.pattern, registry)
	const code = `export const ${jsIdentifier(message.id)} = (${hasInputs ? "inputs" : ""}) => ${compiledPattern.code}`
	return { code, typeRestrictions: compiledPattern.typeRestrictions, source: message }
}

function compileMessageWithMultipleVariants(
	message: MessageNested,
	registry: Registry
): Compilation<MessageNested> {
	if (message.variants.length <= 1) throw new Error("Message must have more than one variant")
	// TODO implements inputs
	const hasInputs = false

	// TODO selector code
	// const selectorCode = `const selectors = [ ${compiledSelectors
	// 	.map((sel) => sel.code)
	// 	.join(", ")} ]`

	// TODO make sure that matchers use keys instead of indexes
	const compiledVariants = sortVariants(message.variants).map((variant): Compilation<Variant> => {
		const compiledPattern = compilePattern(message.locale, variant.pattern, registry)
		const typeRestrictions = compiledPattern.typeRestrictions

		// todo account for all matches in the selector (if a match is missing, it should be the catchall)
		const isCatchAll = variant.matches.every((match) => match.type === "catchall-match")

		if (isCatchAll) {
			return { code: `return ${compiledPattern.code}`, typeRestrictions, source: variant }
		}

		const conditions: string[] = variant.matches
			.filter((match) => match.type === "literal-match")
			.map((match) => match.value)
			.map((value, i) => {
				// we use == instead of === to automatically convert to string if necessary
				return `selectors[${i}] == "${escapeForDoubleQuoteString(value)}"`
			})
			.filter((m) => m !== undefined)

		return {
			code: `if (${conditions.join(" && ")}) return ${compiledPattern.code}`,
			typeRestrictions,
			source: variant,
		}
	})

	const tr = [...compiledVariants.map((v) => v.typeRestrictions)].reduce(mergeTypeRestrictions, {})

	const code = `export const ${jsIdentifier(message.id)} = (${hasInputs ? "inputs" : ""}) => {
	${compiledVariants.map((l) => `\t${l.code}`).join("\n")}
}`

	return { code, typeRestrictions: tr, source: message }
}

// function addTypes(compilation: Compilation<MessageNested>): Compilation<MessageNested> {
// 	// add types for the inputs
// 	const tr = structuredClone(compilation.typeRestrictions)
// 	for (const decl of compilation.source.declarations) {
// 		const name = decl.value.arg.name
// 		if (name in tr) continue
// 		tr[name] = "NonNullable<unknown>"
// 	}

// 	const code = `/**
//  * ${inputsType(tr, false)}
//  * @returns {string}
//  */
// /* @__NO_SIDE_EFFECTS__ */
// ${compilation.code}`

// 	return {
// 		...compilation,
// 		typeRestrictions: tr,
// 		code,
// 	}
// }

/**
 * Sorts variants from most-specific to least-specific.
 *
 * @param variants
 */
function sortVariants(variants: Variant[]): Variant[] {
	function compareMatches(a: string, b: string): number {
		if (a === "*" && b === "*") return 0
		if (a === "*") 1
		if (b === "*") return -1
		return 0
	}
	// not using .toSorted() because node js 18 doesn't have it
	const copy = [...variants]
	return copy.sort((a, b) => {
		let i = 0
		// @ts-ignore
		while (i < Math.min(a.match.length, b.match.length)) {
			// @ts-ignore
			const cmp = compareMatches(a.match[i], b.match[i])
			if (cmp !== 0) return cmp
			i += 1
		}
		return 0
	})
}
