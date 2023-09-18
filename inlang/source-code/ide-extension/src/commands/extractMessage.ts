import * as vscode from "vscode"
import { state } from "../state.js"
import { msg } from "../utilities/message.js"
import { telemetry } from "../services/telemetry/index.js"
import type { Message } from "@inlang/sdk"

/**
 * Helps the user to extract messages from the active text editor.
 */
export const extractMessageCommand = {
	id: "inlang.extractMessage",
	title: "Inlang: Extract Message",
	callback: async function (textEditor: vscode.TextEditor) {
		const ideExtension = state().project.customApi()["app.inlang.ideExtension"]

		// guards
		if (!ideExtension) {
			return msg(
				"There is no `plugin` configuration for the inlang extension. One of the `modules` should expose a `plugin` which has `customApi` containing `app.inlang.ideExtension`",
				"warn",
				"notification",
			)
		}
		if (ideExtension.extractMessageOptions === undefined) {
			return msg(
				"The `extractMessageOptions` are not defined in `app.inlang.ideExtension` but required to extract a message.",
				"warn",
				"notification",
			)
		}
		if (state().project.settings()?.sourceLanguageTag === undefined) {
			return msg(
				"The `sourceLanguageTag` is not defined in the project.inlang.json but required to extract a message.",
				"warn",
				"notification",
			)
		}

		const messageId = await vscode.window.showInputBox({
			title: "Enter the ID:",
		})
		if (messageId === undefined) {
			return
		}

		const messageValue = textEditor.document.getText(textEditor.selection)

		const preparedExtractOptions = ideExtension.extractMessageOptions.reduce((acc, option) => {
			if (acc.includes(option.callback({ messageId, selection: messageValue }))) {
				return acc
			}
			return [...acc, option.callback({ messageId, selection: messageValue })]
		}, [] as string[])

		const preparedExtractOption = await vscode.window.showQuickPick(
			[...preparedExtractOptions, "How to edit these replacement options?"],
			{ title: "Replace highlighted text with:" },
		)
		if (preparedExtractOption === undefined) {
			return
		} else if (
			preparedExtractOption ===
			"How to edit these replacement options? See `extractMessageOptions`."
		) {
			// TODO #152
			return vscode.env.openExternal(
				vscode.Uri.parse(
					"https://github.com/inlang/monorepo/tree/main/inlang/source-code/ide-extension#3%EF%B8%8F%E2%83%A3-configuration",
				),
			)
		}

		if (preparedExtractOption === undefined) {
			return msg("Couldn't find choosen extract option.", "warn", "notification")
		}

		const message: Message = {
			id: messageId,
			selectors: [],
			variants: [
				{
					languageTag: state().project.settings()?.sourceLanguageTag as string,
					match: {},
					pattern: [
						{
							type: "Text",
							value: preparedExtractOption,
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
			return vscode.window.showErrorMessage(`Couldn't upsert new message with id ${messageId}.`)
		}

		await textEditor.edit((editor) => {
			editor.replace(textEditor.selection, preparedExtractOption)
		})
		telemetry.capture({
			event: "IDE-EXTENSION command executed",
			properties: { name: "extract message" },
		})
		return msg("Message extracted.")
	},
} as const
