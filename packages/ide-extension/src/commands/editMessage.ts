import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"
import { CONFIGURATION } from "../configuration.js"
import { selectBundleNested, createMessage, createVariant } from "@inlang/sdk2"
import { Message } from "@inlang/sdk2"

export const editMessageCommand = {
	command: "sherlock.editMessage",
	title: "Sherlock: Edit a Message",
	register: commands.registerCommand,
	callback: async function ({ messageId, locale }: { messageId: Message["id"]; locale: string }) {
		// Get the bundle from the database
		const bundle = await selectBundleNested(state().project.db)
			.where((eb) => eb("bundle.id", "=", messageId))
			.executeTakeFirstOrThrow()

		if (!bundle) {
			return msg(`Message with id ${messageId} not found.`)
		}

		// Find the message with the specified locale or create a new one
		let message = bundle.messages.find((m) => m.locale === locale)

		if (!message) {
			message = createMessage({
				bundleId: bundle.id,
				locale: locale,
				text: "",
			})
		}

		// Find or create the variant for the locale
		let variant = message.variants.find((v) => v.match["locale"] === locale)

		if (!variant) {
			variant = createVariant({
				messageId: message.id,
			})

			message.variants.push(variant)
		}

		// Construct the complete pattern text
		const stringPattern = getStringFromPattern({ pattern: variant.pattern, locale, messageId })

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
		await state()
			.project.db.updateTable("message")
			.set({
				declarations: message.declarations,
				selectors: message.selectors,
			})
			.where("message.id", "=", messageId)
			.execute()

		// Emit event to notify that a message was edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Message updated.")
	},
} as const
