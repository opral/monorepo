import type { Expression, MessageNested, Pattern, Variant } from "@inlang/sdk2"
import {
	TYPE,
	type MessageFormatElement,
	type PluralOrSelectOption,
} from "@formatjs/icu-messageformat-parser"

export function serializeMessage(message: MessageNested): string {
	const ast = variantsToICU1(message.variants, message.selectors)
	return serializeICU1Message(ast)
}

function variantsToICU1(variants: Variant[], selectors: Expression[]): MessageFormatElement[] {
	const [selector, ...remainingSelectors] = selectors

	// if there are no selectors, just return the variant's pattern transpiled to ICU1
	if (!selector) {
		const variant = variants[0]
		if (!variant || variants.length > 1) throw new Error("Expected exactly one variant")
		return patternToICU1(variant.pattern)
	}

	// if there are selectors left, create a select/plural and recursively call this function for each branch
	// TODO, exact plurals and selectordinal and options
	const type = selector.annotation?.name === "plural" ? TYPE.plural : TYPE.select

	const sharedPrefixPattern = commonPrefix(variants.map((variants) => variants.pattern))

	// remove the shared prefix from all variants
	variants = variants.map((variants) => {
		return {
			...variants,
			pattern: variants.pattern.slice(sharedPrefixPattern.length),
		}
	})

	const sharedSuffixPattern = commonSuffix(variants.map((variants) => variants.pattern))
	// remove the shared suffix from all variants
	variants = variants.map((variants) => {
		return {
			...variants,
			pattern: variants.pattern.slice(0, variants.pattern.length - sharedSuffixPattern.length),
		}
	})

	// group variants by selector value
	const variantGroups = Object.groupBy(variants, (variant) => variant.match[0])

	const options: Record<string, PluralOrSelectOption> = {}
	for (const [selectorValue, variants] of Object.entries(variantGroups)) {
		if (!variants) continue

		const branch = selectorValue === "*" ? "other" : selectorValue

		// remove the selector we just selected over from the variant's matches
		const newVariants = variants.map((variant) => {
			return {
				...variant,
				match: variant.match.slice(1),
			}
		})

		const optionPattern = variantsToICU1(newVariants, remainingSelectors)
		if (optionPattern.length !== 0) {
			options[branch] = {
				value: optionPattern,
			}
		}
	}

	// if there are no options, just return []
	if (Object.keys(options).length === 0)
		return [...patternToICU1(sharedPrefixPattern), ...patternToICU1(sharedSuffixPattern)]

	return [
		...patternToICU1(sharedPrefixPattern),
		{
			type,
			pluralType: type === TYPE.plural ? "cardinal" : undefined,
			value: selector.arg.name,
			options,
		},
		...patternToICU1(sharedSuffixPattern),
	] as MessageFormatElement[]
}

/**
 * Returns the common prefix of all the patterns
 */
function commonPrefix(patterns: Pattern[]): Pattern {
	const prefix: Pattern = []

	for (let i = 0; i < Math.min(...patterns.map((pattern) => pattern.length)); i++) {
		const elementsAtIndex = patterns.map((pattern) => pattern[i]).filter((p) => !!p)
		const baseElemenet = elementsAtIndex[0]
		if (!baseElemenet) break

		const allEqual = elementsAtIndex.reduce(
			(acc, el) => acc && patternElementsAreEqual(el, baseElemenet),
			true
		)
		if (!allEqual) break
		prefix.push(baseElemenet)
	}

	return prefix
}

function commonSuffix(patterns: Pattern[]): Pattern {
	const suffix: Pattern = []

	for (let i = 0; i < Math.min(...patterns.map((pattern) => pattern.length)); i++) {
		const elementsAtIndex = patterns
			.map((pattern) => pattern[pattern.length - 1 - i])
			.filter((p) => !!p)
		const baseElemenet = elementsAtIndex[0]
		if (!baseElemenet) break

		const allEqual = elementsAtIndex.reduce(
			(acc, el) => acc && patternElementsAreEqual(el, baseElemenet),
			true
		)
		if (!allEqual) break
		suffix.unshift(baseElemenet)
	}

	return suffix
}

function patternElementsAreEqual(el_a: Pattern[number], el_b: Pattern[number]): boolean {
	if (el_a.type !== el_b.type) return false
	if (el_a.type === "text" && el_b.type === "text") {
		return el_a.value === el_b.value
	}

	if (el_a.type === "expression" && el_b.type === "expression") {
		// must have the same arg
		if (el_a.arg.name !== el_b.arg.name) return false

		// if one has an annotation, the other one must have one aswell
		if (el_a.annotation && !el_b.annotation) return false
		if (!el_a.annotation && el_b.annotation) return false

		// if both have annotations, they must be the same
		if (el_a.annotation && el_b.annotation) {
			if (el_a.annotation.name !== el_b.annotation.name) return false
			if (!recordsAreEqual(el_a.annotation.options, el_b.annotation.options)) return false
		}
	}

	return true
}

function recordsAreEqual(a: Record<string, any>, b: Record<string, any>): boolean {
	// same size
	if (Object.keys(a).length !== Object.keys(b).length) return false

	// same keys and values
	for (const key in a) {
		if (a[key] !== b[key]) return false
	}

	return true
}

function patternToICU1(pattern: Pattern): MessageFormatElement[] {
	return pattern.map((icu2El): MessageFormatElement => {
		if (icu2El.type === "text") {
			return { type: TYPE.literal, value: icu2El.value }
		}

		// expression
		if (!icu2El.annotation) {
			// variable interpolation
			return { type: TYPE.argument, value: icu2El.arg.name }
		}

		// function
		const type = (
			{
				time: TYPE.time,
				number: TYPE.number,
				date: TYPE.date,
			} as const
		)[icu2El.annotation.name]
		if (type === undefined) throw new Error(`Unsupported function ${icu2El.annotation.name}`)

		return { type, value: icu2El.arg.name }
	})
}

/**
 * @param element An ICU1 ast
 * @returns The serialized ICU1 MessageFormat string
 * @private Only exported for tests
 */
function serializeICU1Message(elements: MessageFormatElement[]): string {
	let result = ""

	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal: {
				result += element.value
				break
			}
			case TYPE.argument: {
				result += "{" + element.value + "}"
				break
			}
			case TYPE.time:
			case TYPE.number:
			case TYPE.date: {
				const fnName = {
					[TYPE.time]: "time",
					[TYPE.number]: "number",
					[TYPE.date]: "date",
				}[element.type]

				result +=
					"{" + element.value + ", " + fnName + element.style ? ", " + element.style : "" + "}"

				break
			}
			// case added for completeness. We don't generate pound-elements yet, but it could be done
			case TYPE.pound:
				result += "#"
				break
			case TYPE.select: {
				const options: string[] = []
				for (const [name, value] of Object.entries(element.options)) {
					options.push(name + " {" + serializeICU1Message(value.value) + "}")
				}
				result += "{" + element.value + ", select, " + options.join(" ") + "}"
				break
			}
			case TYPE.plural: {
				const fnName = {
					ordinal: "selectOrdinal",
					cardinal: "plural",
				}[element.pluralType || "cardinal"]

				const options: string[] = []
				for (const [name, value] of Object.entries(element.options)) {
					options.push(name + " {" + serializeICU1Message(value.value) + "}")
				}

				result += "{" + element.value + ", " + fnName + ", " + options.join(" ") + "}"
				break
			}

			case TYPE.tag: // we don't support markup yet. This should be a text-element instead
			default: {
				throw new Error(`Unsupported ICU1 element of type: ${(element as any)?.type}`)
			}
		}
	}

	return result
}

// Exports for testing
export { serializeICU1Message as _serializeICU1Message }
