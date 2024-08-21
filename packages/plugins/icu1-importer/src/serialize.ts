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

		options[branch] = {
			value: variantsToICU1(newVariants, remainingSelectors),
		}
	}

	return [
		{
			type,
			pluralType: type === TYPE.plural ? "cardinal" : undefined,
			value: selector.arg.name,
			options,
		},
	] as MessageFormatElement[]
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
