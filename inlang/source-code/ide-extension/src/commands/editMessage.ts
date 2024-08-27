import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"
import { CONFIGURATION } from "../configuration.js"
import { createMessage, createVariant, Bundle, Variant } from "@inlang/sdk2"

export const editMessageCommand = {
	command: "sherlock.editMessage",
	title: "Sherlock: Edit a Message",
	register: commands.registerCommand,
	callback: async function ({ bundleId, locale }: { bundleId: Bundle["id"]; locale: string }) {
		// Get the bundle from the database
		let message = await state()
			.project.db.selectFrom("message")
			.where("message.bundleId", "=", bundleId)
			.where("locale", "=", locale)
			.selectAll()
			.executeTakeFirst()

		if (!message) {
			message = createMessage({
				bundleId: bundleId,
				locale: locale,
				text: "",
			})
		}

		// Find or create the variant for the locale
		let variant: Variant | undefined = await state()
			.project.db.selectFrom("variant")
			.where("variant.messageId", "=", message.id)
			.selectAll()
			.executeTakeFirst()

		if (!variant) {
			variant = createVariant({
				messageId: message.id,
			})

			// Add the new variant to the message's variants list
			message.variants.push(variant)
		}

		// Construct the complete pattern text
		const stringPattern = getStringFromPattern({
			pattern: variant.pattern,
			locale,
			messageId: message.id,
		})

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

		// Upsert the updated message and variant
		await state()
			.project.db.updateTable("message")
			.set({
				declarations: message.declarations,
				selectors: message.selectors,
			})
			.where("message.id", "=", message.id)
			.execute()

		await state()
			.project.db.updateTable("variant")
			.set({
				pattern: variant.pattern,
			})
			.where("variant.id", "=", variant.id)
			.execute()

		// Emit event to notify that a message was edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Message updated.")
	},
} as const
