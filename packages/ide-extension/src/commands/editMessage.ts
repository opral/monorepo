import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"
import { CONFIGURATION } from "../configuration.js"
import { Bundle, selectBundleNested } from "@inlang/sdk2"

export const editMessageCommand = {
	command: "sherlock.editMessage",
	title: "Sherlock: Edit a Message",
	register: commands.registerCommand,
	callback: async function ({ bundleId, locale }: { bundleId: Bundle["id"]; locale: string }) {
		// Get the message from the database
		const bundle = await selectBundleNested(state().project.db)
			.where("bundle.id", "=", bundleId)
			.executeTakeFirst()

		if (!bundle) {
			return msg(`Bundle with id ${bundleId} not found.`)
		}

		// Get the message from the bundle
		const message = bundle.messages.find((m) => m.locale === locale)

		if (!message) {
			return msg(`Message with locale ${locale} not found.`)
		}

		// Get the variant from the message
		const variant = message.variants.find((v) => v.match.locale === locale)

		if (!variant) {
			return msg(`Variant with locale ${locale} not found.`)
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
			.project.db.transaction()
			.execute(async (trx) => {
				await trx
					.updateTable("message")
					.set({
						declarations: message.declarations,
						selectors: message.selectors,
					})
					.where("message.id", "=", message.id)
					.execute()

				await trx
					.updateTable("variant")
					.set({
						pattern: variant.pattern,
					})
					.where("variant.id", "=", variant.id)
					.execute()
			})

		// Emit event to notify that a message was edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Message updated.")
	},
} as const
