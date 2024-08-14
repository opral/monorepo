import {
	parse as parseICU,
	TYPE,
	type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import type { BundleNested, Declaration, MessageNested } from "@inlang/sdk2"

export function parse(messageSource: string): Omit<MessageNested, "id" | "locale" | "bundleId"> {
	const ast = parseICU(messageSource)

	const declarations: Declaration[] = []

	const branches: { value: string; cases: string[] }[] = []
	function walk(el: MessageFormatElement) {
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

	for (const el of ast) walk(el)

	const message: Omit<MessageNested, "id" | "locale" | "bundleId"> = {
		declarations: [],
		selectors: [],
		variants: [],
	}

	return message
}
