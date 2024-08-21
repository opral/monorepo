import type { MessageNested, Pattern } from "@inlang/sdk2"
import { TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser"

type Branch = {
	/**
	 * The (partial) Pattern that this branch results in
	 */
	pattern: Pattern

	/**
	 * The (partial) match-values that are needed to produce this branch
	 * [arg, function?, match]
	 *
	 * Add options?
	 */
	match: {
		arg: string
		function?: string // todo: add options?
		match: string
	}[]
}

export function serializeMessage(message: MessageNested): string {
	const branches = getBranches(message)
	if (branches.length < 1) return "" // shouldn't happen, just being safe

	const ast = branchesToICU1(branches)
	return serializeICU1Message(ast)
}

/**
 * Turns the variants into branches that we can work with more easily.
 *
 * Branches contain the information of both the variant and the selectors, so they're easier to
 * work with than just variants.
 */
function getBranches(message: MessageNested): Branch[] {
	const branches: Branch[] = []
	for (const variant of message.variants) {
		const match: Branch["match"] = []

		for (let i = 0; i < message.selectors.length; i++) {
			const selector = message.selectors[i]
			const match = variant.match[i]
			if (match === "*") continue
			if (selector?.arg.type !== "variable") continue

			const arg = selector?.arg.name
			const fnName = selector?.annotation?.name

			match.push({
				arg,
				function: fnName,
				match: match,
			})
		}

		const branch: Branch = {
			pattern: variant.pattern,
			match,
		}

		branches.push(branch)
	}

	return branches
}

function branchesToICU1(branches: Branch[]): MessageFormatElement[] {
	const elements: MessageFormatElement[] = []

	// group branches by their next element

	// Two cases
	// 1. All the branches in one group -> append the element to the result
	// 2. Not all the branches in one group -> discriminate by selectors

	return elements
}

/**
 * @param element An ICU1 ast
 * @returns The serialized ICU1 MessageFormat string
 * @private Only exported for tests
 */
export function serializeICU1Message(elements: MessageFormatElement[]): string {
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

				result += "{" + element.value + ", " + fnName + "," + options.join(" ") + "}"
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
