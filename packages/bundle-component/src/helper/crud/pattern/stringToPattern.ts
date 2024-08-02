import type { Pattern } from "@inlang/sdk2"

/**
 * MVP version of the function
 *
 * Converts a string to a pattern.
 * @param props.text The text to convert to a pattern.
 * @returns The pattern of the text.
 *
 * @example
 * stringToPattern({ text: "Hello {{name}}" }) -> [{ value: "Hello" }, { type: "expression", arg: { type: "variable", name: "name" } }]
 */

const stringToPattern = (props: { text: string }): Pattern => {
	const pattern: Pattern = []
	const regex = /{{(.*?)}}/g
	let lastIndex = 0
	let match

	while ((match = regex.exec(props.text)) !== null) {
		// Add text node for text before the variable
		if (match.index > lastIndex) {
			pattern.push({
				type: "text",
				value: props.text.slice(lastIndex, match.index),
			})
		}
		// Add variable node
		if (match[1]) {
			pattern.push({
				type: "expression",
				arg: {
					type: "variable",
					name: match[1],
				},
			})
			lastIndex = regex.lastIndex
		}
	}

	// Add remaining text node after the last variable
	if (lastIndex < props.text.length) {
		pattern.push({
			type: "text",
			value: props.text.slice(lastIndex),
		})
	}

	return pattern
}

export default stringToPattern
