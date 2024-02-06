import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import type { LanguageTag, Message } from "@inlang/sdk"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"
import { CONFIGURATION } from "../configuration.js"

export const editMessageCommand = {
	command: "inlang.editMessage",
	title: "Inlang: Edit a Message",
	register: commands.registerCommand,
	callback: async function ({
		messageId,
		languageTag,
	}: {
		messageId: Message["id"]
		languageTag: LanguageTag
	}) {
		// Get the message from the state
		const message = state().project.query.messages.get({ where: { id: messageId } })
		if (!message) {
			return msg(`Message with id ${messageId} not found.`)
		}

		// Find the variant with the specified language tag or create a new one
		let variant = message.variants.find((v) => v.languageTag === languageTag)
		if (!variant) {
			// Create a new variant
			variant = {
				languageTag,
				match: [],
				pattern: [
					{
						type: "Text",
						value: "",
					},
				],
			}
			message.variants.push(variant)
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
		state().project.query.messages.upsert({
			where: { id: messageId },
			data: message,
		})

		// Emit event to notify that a message was edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Message updated.")
	},
} as const
