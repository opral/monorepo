import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, type TextEditor, window } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import { CONFIGURATION } from "../configuration.js"
import { isQuoted, stripQuotes } from "../utilities/messages/isQuoted.js"
import { getSetting } from "../utilities/settings/index.js"
import {
	createBundle,
	createMessage,
	generateBundleId,
	type IdeExtensionConfig,
} from "@inlang/sdk2"

/**
 * Helps the user to extract messages from the active text editor.
 */
export const extractMessageCommand = {
	command: "sherlock.extractMessage",
	title: "Sherlock: Extract Message",
	register: commands.registerTextEditorCommand,
	callback: async function (textEditor: TextEditor | undefined) {
		const ideExtension = state()
			.project.plugins.get()
			.find((plugin) => plugin?.meta?.["app.inlang.ideExtension"])?.meta?.[
			"app.inlang.ideExtension"
		] as IdeExtensionConfig | undefined

		const baseLocale = state().project.settings.get().baseLocale

		// guards
		if (!ideExtension) {
			return msg(
				"There is no `plugin` configuration for the Visual Studio Code extension (Sherlock). One of the `modules` should expose a `plugin` which has `customApi` containing `app.inlang.ideExtension`",
				"warn",
				"notification"
			)
		}
		if (ideExtension.extractMessageOptions === undefined) {
			return msg(
				"The `extractMessageOptions` are not defined in `app.inlang.ideExtension` but required to extract a message.",
				"warn",
				"notification"
			)
		}
		if (baseLocale === undefined) {
			return msg(
				"The `baseLocale` is not defined in the project but required to extract a message.",
				"warn",
				"notification"
			)
		}

		if (textEditor === undefined) {
			return msg(
				"No active text editor found. Please open a file in the editor to extract a message.",
				"warn",
				"notification"
			)
		}

		if (textEditor.selection.isEmpty) {
			return msg("Please select a text to extract in your text editor.", "warn", "notification")
		}

		// create random message id as default value
		const autoHumanId = await getSetting("extract.autoHumanId.enabled").catch(() => true)

		const bundleId = await window.showInputBox({
			title: "Enter the ID:",
			value: autoHumanId ? generateBundleId() : "",
			prompt:
				autoHumanId &&
				"Tip: It's best practice to use random names for your messages. Read this [guide](https://inlang.com/documentation/concept/message#idhuman-readable) for more information.",
		})
		if (bundleId === undefined) {
			return
		}

		const messageValue = textEditor.document.getText(textEditor.selection)

		const preparedExtractOptions = ideExtension.extractMessageOptions.reduce((acc, option) => {
			const formattedSelection = isQuoted(messageValue) ? stripQuotes(messageValue) : messageValue
			const formattedOption = option.callback({
				bundleId,
				selection: formattedSelection,
			})

			if (acc.includes(formattedOption)) {
				return acc
			}
			return [...acc, formattedOption]
		}, [] as { bundleId: string; messageReplacement: string }[])

		const messageReplacements = preparedExtractOptions.map(
			({ messageReplacement }) => messageReplacement
		)

		const preparedExtractOption = await window.showQuickPick(messageReplacements, {
			title: "Replace highlighted text with:",
		})
		if (preparedExtractOption === undefined) {
			return
		}

		const selectedExtractOption = preparedExtractOptions.find(
			({ messageReplacement }) => messageReplacement === preparedExtractOption
		)

		if (selectedExtractOption === undefined) {
			return msg("Couldn't find choosen extract option.", "warn", "notification")
		}

		const message = createMessage({
			bundleId: selectedExtractOption.bundleId,
			locale: baseLocale,
			text: isQuoted(messageValue) ? stripQuotes(messageValue) : messageValue,
		})

		const bundle = createBundle({
			id: bundleId,
			messages: [message],
		})

		// create message
		const success = await state()
			.project.db.transaction()
			.execute(async (trx) => {
				await trx
					.insertInto("bundle")
					.values({
						id: bundle.id,
						alias: bundle.alias,
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

		if (!success) {
			return window.showErrorMessage(`Couldn't upsert new message with id ${bundleId}.`)
		}

		await textEditor.edit((editor) => {
			editor.replace(textEditor.selection, preparedExtractOption)
		})

		// Emit event to notify that a message was extracted
		CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire()

		telemetry.capture({
			event: "IDE-EXTENSION command executed: Extract Message",
		})
		return msg("Message extracted.")
	},
} as const
