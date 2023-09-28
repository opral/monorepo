import type { LanguageTag, Message, Pattern } from "@inlang/sdk"
import { msg } from "./message.js"

// get string from Pattern
export const getStringFromPattern = (args: {
	pattern: Pattern
	languageTag: LanguageTag
	messageId: Message["id"]
}): string => {
	return args.pattern
		.map((element) => {
			if (element.type === "Text") {
				return element.value
			} else if (element.type === "VariableReference") {
				return `{${element.name}}` // TODO: Use framework specific placeholder indication
			} else {
				return msg(
					`Unknown pattern element type in message with id ${args.messageId} for languageTag ${args.languageTag}.`
				)
			}
		})
		.join("")
}

// get Pattern from string
export const getPatternFromString = (args: { string: string }): Pattern => {
	const patternElements = args.string.split(/({.*?})/g) // TODO: Use framework specific placeholder indication
	const patternElementsWithTypes = patternElements.map((element) => {
		if (element.startsWith("{") && element.endsWith("}")) {
			return {
				type: "VariableReference" as const,
				name: element.slice(1, -1),
			}
		} else {
			return {
				type: "Text" as const,
				value: element,
			}
		}
	})
	return patternElementsWithTypes
}
