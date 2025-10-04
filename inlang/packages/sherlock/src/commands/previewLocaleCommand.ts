import * as vscode from "vscode"
import { updateSetting } from "../utilities/settings/index.js"
import { state } from "../utilities/state.js"
import { CONFIGURATION } from "../configuration.js"

export const previewLocaleCommand = {
	command: "sherlock.previewLanguageTag",
	title: "Sherlock: Change preview language tag",
	register: vscode.commands.registerCommand,
	callback: async () => {
		const settings = await state().project?.settings.get()
		const selectedLocale = await vscode.window.showQuickPick(settings.locales, {
			placeHolder: "Select a language",
		})

		if (!selectedLocale) {
			return
		}

		// TODO: Update key for locale
		await updateSetting("previewLanguageTag", selectedLocale)

		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire({ origin: "command:previewLocale" })
		CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire()
		CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire()
		CONFIGURATION.EVENTS.ON_DID_PREVIEW_LOCALE_CHANGE.fire(selectedLocale)
	},
}
