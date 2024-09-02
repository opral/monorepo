import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import { createMessage, humanId } from "@inlang/sdk2"
import { CONFIGURATION } from "../configuration.js"
import { getSetting } from "../utilities/settings/index.js"

/**
 * Helps the user to create messages by prompting for the message content.
 */
export const createMessageCommand = {
	command: "sherlock.createMessage",
	title: "Sherlock: Create Message",
	register: commands.registerCommand,
	callback: async function () {
		const baseLocale = (await state().project.settings.get()).baseLocale

		const messageValue = await window.showInputBox({
			title: "Enter the message content:",
		})

		if (messageValue === undefined) {
			return
		}

		// create random message id as default value
		const autoHumanId = await getSetting("extract.autoHumanId.enabled").catch(() => true)

		const bundleId = await window.showInputBox({
			title: "Enter the ID:",
			value: autoHumanId ? humanId() : "",
			prompt:
				(autoHumanId &&
					"Tip: It's best practice to use random names for your messages. Read this [guide](https://inlang.com/documentation/concept/message#idhuman-readable) for more information.") ||
				undefined,
		})
		if (bundleId === undefined) {
			return
		}

		const message = createMessage({
			bundleId,
			locale: baseLocale,
			text: messageValue,
		})

		try {
			await state()
				.project.db.transaction()
				.execute(async (trx) => {
					await trx
						.insertInto("bundle")
						.values({
							id: bundleId,
						})
						.execute()

					return await trx
						.insertInto("message")
						.values({
							id: message.id,
							bundleId: message.bundleId,
							locale: message.locale,
							declarations: message.declarations,
							selectors: message.selectors,
						})
						.returningAll()
						.execute()
				})

			// Emit event to notify that a message was created
			CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire()

			telemetry.capture({
				event: "IDE-EXTENSION command executed: Create Message",
			})

			return msg("Message created.")
		} catch (e) {
			return window.showErrorMessage(`Couldn't upsert new message. ${e}`)
		}
	},
} as const
