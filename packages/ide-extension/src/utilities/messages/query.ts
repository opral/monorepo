import type { Message, Pattern, Expression, Text } from "@inlang/sdk2"
import { msg } from "./msg.js"

export const getStringFromPattern = (args: {
	pattern: Pattern
	locale: string
	messageId: Message["id"]
}): string => {
	return args.pattern
		.map((element) => {
			if (element.type === "text") {
				return (element as Text).value
			} else if (element.type === "expression") {
				const expression = element as Expression
				if (expression.arg.type === "variable-reference") {
					return `{${expression.arg.name}}` // Handle VariableReference within Expression
				} else if (expression.arg.type === "literal") {
					return expression.arg.value // Handle Literal within Expression
				} else {
					return msg(
						`Unknown expression type in variant with message id ${args.messageId} for locale ${args.locale}.`
					)
				}
			} else {
				return msg(
					`Unknown pattern element type in variant with message id ${args.messageId} for locale ${args.locale}.`
				)
			}
		})
		.join("")
}

export const getPatternFromString = (args: { string: string }): Pattern => {
	const patternElements = args.string.split(/(\\?{.*?})/g) // Split by placeholder patterns
	const patternElementsWithTypes = patternElements
		.flatMap((element) => {
			if (element.startsWith("{") && element.endsWith("}")) {
				return {
					type: "expression" as const,
					arg: {
						type: "variable-reference" as const,
						name: element.slice(1, -1),
					},
				} as Expression // Return as an Expression with a VariableReference
			} else if (element && element !== "") {
				return {
					type: "text" as const,
					value: element,
				} as Text // Return as Text
			}
			return undefined
		})
		.filter(Boolean) as Pattern // Filter out any undefined elements
	return patternElementsWithTypes
}
