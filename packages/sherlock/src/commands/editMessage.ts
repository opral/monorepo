import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, window } from "vscode"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"
import { CONFIGURATION } from "../configuration.js"
import { type Bundle } from "@inlang/sdk"
import { getSelectedBundleByBundleIdOrAlias } from "../utilities/helper.js"

export const editMessageCommand = {
	command: "sherlock.editMessage",
	title: "Sherlock: Edit a Message",
	register: commands.registerCommand,
	callback: async function ({ bundleId, locale }: { bundleId: Bundle["id"]; locale: string }) {
		const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

		if (!bundle) {
			return msg(`Bundle with id ${bundleId} not found.`)
		}

		const message = bundle.messages.find((m) => m.locale === locale)

		if (!message) {
			return msg(`Message with locale ${locale} not found.`)
		}

		const variant = message?.variants.find((v) => v.matches.length === 0)

		if (!variant) {
			return msg(`Variant with locale ${locale} not found.`)
		}

		// Construct the complete pattern text
		const stringPattern = getStringFromPattern({
			pattern: variant.pattern,
			locale,
			messageId: message.id,
		})

		const newValue = await window.showInputBox({
			title: "Enter new value:",
			value: stringPattern,
		})

		if (!newValue) {
			return
		}

		variant.pattern = getPatternFromString({ string: newValue })

		try {
			await state()
				.project.db.transaction()
				.execute(async (trx) => {
					await trx
						.updateTable("message")
						.set({
							selectors: message.selectors,
						})
						.where("message.id", "=", message.id)
						.execute()

					return await trx
						.updateTable("variant")
						.set({
							pattern: variant.pattern,
						})
						.where("variant.id", "=", variant.id)
						.execute()
				})

			CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire({ origin: "command:editMessage" })

			return msg("Message updated.")
		} catch (e) {
			return msg(`Couldn't update bundle with id ${bundleId}. ${e}`)
		}
	},
} as const
