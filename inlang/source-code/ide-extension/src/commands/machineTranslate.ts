import { commands } from "vscode"
import { Message } from "@inlang/sdk2"
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
		targetLocales,
	}: {
		messageId: Message["id"]
		baseLocale: string
		targetLocales: string[]
	}) {
		// Get the message from the database
		const message = await state()
			.project.db.selectFrom("message")
			.selectAll()
			.where("message.id", "=", messageId)
			.executeTakeFirst()

		if (!message) {
			return msg(`Message with id ${messageId} not found.`)
		}

		// Call machine translation RPC function

		const result = await rpc.machineTranslateMessage({
			message,
			// TODO: refactor machine translation to use baseLocale and targetLocales
			// @ts-expect-error
			baseLocale,
			targetLocales,
		})

		if (result.error) {
			return msg(`Error translating message: ${result.error}`)
		}

		// Update the message with the translated content
		const updatedMessages = result.data
		if (!updatedMessages || !Array.isArray(updatedMessages)) {
			return msg("No translations available.")
		}

		// Upsert each translated message directly using Kysely
		for (const updatedMessage of updatedMessages) {
			await state()
				.project.db.insertInto("message")
				.values({
					id: updatedMessage.id,
					bundleId: updatedMessage.bundleId,
					locale: updatedMessage.locale,
					declarations: updatedMessage.declarations,
					selectors: updatedMessage.selectors,
				})
				.onConflict((oc) =>
					oc.column("id").doUpdateSet({
						bundleId: updatedMessage.bundleId,
						locale: updatedMessage.locale,
						declarations: updatedMessage.declarations,
						selectors: updatedMessage.selectors,
					})
				)
				.execute()
		}

		// Emit event to notify that messages were edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

		// Return success message
		return msg("Messages translated.")
	},
} as const
