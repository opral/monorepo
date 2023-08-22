import { state } from "../state.js"
import { msg } from "../utilities/message.js"
import { EventEmitter, window } from "vscode"
import type { LanguageTag, Message, Pattern } from "@inlang/app"

const onDidEditMessageEmitter = new EventEmitter<void>()
export const onDidEditMessage = onDidEditMessageEmitter.event

// get string from pattern
const getStringFromPattern = (args: {
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
					`Unknown pattern element type in message with id ${args.messageId} for languageTag ${args.languageTag}.`,
				)
			}
		})
		.join("")
}

// get Pattern from string
const getPatternFromString = (args: { string: string }): Pattern => {
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

export const editMessageCommand = {
	id: "inlang.editMessage",
	title: "Inlang: Edit Message",
	callback: async function ({
		messageId,
		languageTag,
	}: {
		messageId: Message["id"]
		languageTag: LanguageTag
	}) {
		// Get the message from the state
		const message = state().inlang.query.messages.get({ where: { id: messageId } })
		if (!message) {
			return msg(`Message with id ${messageId} not found.`)
		}

		// Find the variant with the specified language tag
		const variant = message.variants.find((v) => v.languageTag === languageTag)
		if (!variant) {
			return msg(
				`Variant with language tag ${languageTag} in message with id ${messageId} not found.`,
			)
		}

		// Construct the complete pattern text
		const stringPattern = getStringFromPattern({ pattern: variant.pattern, languageTag, messageId })

		// Show input box with current message content
		const newValue = await window.showInputBox({
			title: "Enter new value:",
			value: stringPattern,
		})
		if (!newValue) {
			return
		}

		// Update the pattern
		variant.pattern = getPatternFromString({ string: newValue })

		// Upsert the updated message
		state().inlang.query.messages.upsert({
			where: { id: messageId },
			data: message,
		})

		// Emit event to notify that a message was edited
		onDidEditMessageEmitter.fire()

		// Return success message
		return msg("Message updated.")
	},
} as const
