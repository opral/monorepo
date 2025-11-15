import { commands } from "vscode"
import { type Bundle } from "@inlang/sdk"
import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { rpc } from "@inlang/rpc"
import { CONFIGURATION } from "../configuration.js"
import { getSelectedBundleByBundleIdOrAlias } from "../utilities/helper.js"

export const machineTranslateMessageCommand = {
	command: "sherlock.machineTranslateMessage",
	title: "Sherlock: Machine Translate Message",
	register: commands.registerCommand,
	callback: async function ({
		bundleId,
		baseLocale,
		targetLocales,
	}: {
		bundleId: Bundle["id"]
		baseLocale: string
		targetLocales: string[]
	}) {
		// Get the message from the database
		const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

		if (!bundle) {
			return msg(`Bundle with id ${bundleId} not found.`)
		}

		// Call machine translation RPC function

		const result = await rpc.machineTranslateBundle({
			bundle,
			// TODO: refactor machine translation to use baseLocale and targetLocales
			sourceLocale: baseLocale,
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
					selectors: updatedMessage.selectors,
				})
				.execute()
		}

		// Emit event to notify that messages were edited
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire({ origin: "command:machineTranslate" })

		// Return success message
		return msg("Messages translated.")
	},
} as const
