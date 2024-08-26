import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { commands, type TextEditor, window } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import { CONFIGURATION } from "../configuration.js"
import { isQuoted, stripQuotes } from "../utilities/messages/isQuoted.js"
import { Message, randomHumanId } from "@inlang/sdk"
import { getSetting } from "../utilities/settings/index.js"

/**
 * Helps the user to extract messages from the active text editor.
 */
export const extractMessageCommand = {
	command: "sherlock.extractMessage",
	title: "Sherlock: Extract Message",
	register: commands.registerTextEditorCommand,
	callback: async function (textEditor: TextEditor | undefined) {
		const ideExtension = state().project.customApi()["app.inlang.ideExtension"]
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

		const messageId = await window.showInputBox({
			title: "Enter the ID:",
			value: autoHumanId ? randomHumanId() : "",
			prompt:
				autoHumanId &&
				"Tip: It's best practice to use random names for your messages. Read this [guide](https://inlang.com/documentation/concept/message#idhuman-readable) for more information.",
		})
		if (messageId === undefined) {
			return
		}

		const messageValue = textEditor.document.getText(textEditor.selection)

		const preparedExtractOptions = ideExtension.extractMessageOptions.reduce((acc, option) => {
			const formattedSelection = isQuoted(messageValue) ? stripQuotes(messageValue) : messageValue
			const formattedOption = option.callback({ messageId, selection: formattedSelection })

			if (acc.includes(formattedOption)) {
				return acc
			}
			return [...acc, formattedOption]
		}, [] as { messageId: string; messageReplacement: string }[])

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

		const message: Message = {
			id: selectedExtractOption.messageId,
			alias: {},
			selectors: [],
			variants: [
				{
					languageTag: state().project.settings.get()?.baseLocale as string,
					match: [],
					pattern: [
						{
							type: "Text",
							value: isQuoted(messageValue) ? stripQuotes(messageValue) : messageValue,
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
