import {
	parse as parseICU,
	TYPE,
	type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import type { BundleNested, Declaration, MessageNested } from "@inlang/sdk2"

export function parse(messageSource: string): Omit<MessageNested, "id" | "locale" | "bundleId"> {
	const ast = parseICU(messageSource)

	const declarations: Declaration[] = []

	/**
	 * A case-path is an array of numbers and strings
	 *
	 * The number denotes that this is the n-th selector on it's level. The string is the match-value
	 * that will result in this case.
	 */
	type CasePath = [number, string][]

	// All the case-paths that exist in the message
	const cases: CasePath[] = []

	const branches: { value: string; cases: string[] }[] = []
	function walk(el: MessageFormatElement, path: CasePath) {
		switch (el.type) {
			case TYPE.argument: {
				declarations.push({
					type: "input",
					name: el.value,
					value: {
						type: "expression",
						arg: { type: "variable", name: el.value },
					},
				})
				break
			}
			case TYPE.select: {
				branches.push({ value: el.value, cases: el.options.map((o) => o.value) })
			}
		}
	}

	for (const el of ast) walk(el, [])

	const message: Omit<MessageNested, "id" | "locale" | "bundleId"> = {
		declarations: [],
		selectors: [],
		variants: [],
	}

	return message
}
