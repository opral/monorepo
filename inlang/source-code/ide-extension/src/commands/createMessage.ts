import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import type { Message } from "@inlang/sdk"
import { CONFIGURATION } from "../configuration.js"

/**
 * Helps the user to create messages by prompting for the message content.
 */
export const createMessageCommand = {
	command: "sherlock.createMessage",
	title: "Sherlock: Create Message",
	register: commands.registerCommand,
	callback: async function () {
		const sourceLanguageTag = state().project.settings().sourceLanguageTag

		// guard
		if (sourceLanguageTag === undefined) {
			return msg(
				"The `sourceLanguageTag` is not defined in the project but required to create a message.",
				"warn",
				"notification"
			)
		}

		const messageValue = await window.showInputBox({
			title: "Enter the message content:",
		})
		if (messageValue === undefined) {
			return
		}

		const messageId = await window.showInputBox({
			title: "Enter the ID:",
		})
		if (messageId === undefined) {
			return
		}

		const message: Message = {
			id: messageId,
			alias: {},
			selectors: [],
			variants: [
				{
					languageTag: sourceLanguageTag,
					match: [],
					pattern: [
						{
							type: "Text",
							value: messageValue,
						},
					],
				},
			],
		}

		// create message
		const success = state().project.query.messages.create({
			data: message,
		})

		if (!success) {
			return window.showErrorMessage(`Couldn't upsert new message with id ${messageId}.`)
		}

		// Emit event to notify that a message was created
		CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire()

		telemetry.capture({
			event: "IDE-EXTENSION command executed",
		})
		return msg("Message created.")
	},
} as const
