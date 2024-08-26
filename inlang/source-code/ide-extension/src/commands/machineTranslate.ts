import { commands } from "vscode"
import { LanguageTag, Message } from "@inlang/sdk"
import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { rpc } from "@inlang/rpc"
import { CONFIGURATION } from "../configuration.js"

export const machineTranslateMessageCommand = {
	command: "sherlock.machineTranslateMessage",
	title: "Sherlock: Machine Translate Message",
	register: commands.registerCommand,
	callback: async function ({
		messageId,
		baseLocale,
		targetLanguageTags,
	}: {
		messageId: Message["id"]
		baseLocale: LanguageTag
		targetLanguageTags: LanguageTag[]
	}) {
		// Get the message from the state
		const message = state().project.query.messages.get({ where: { id: messageId } })
		if (!message) {
			return msg(`Message with id ${messageId} not found.`)
		}

		// Call machine translation RPC function
		const result = await rpc.machineTranslateMessage({
			message,
			baseLocale,
			targetLanguageTags,
		})

		if (result.error) {
			return msg(`Error translating message: ${result.error}`)
		}

		// Update the message with the translated content
		const updatedMessage = result.data
		if (!updatedMessage) {
			return msg("No translation available.")
		}

		state().project.query.messages.upsert({
			where: { id: messageId },
			data: updatedMessage,
		})

		// Emit event to notify that a message was edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Message translated.")
	},
} as const
