import * as vscode from "vscode"
import { updateSetting } from "../utilities/settings/index.js"
import { state } from "../utilities/state.js"
import { CONFIGURATION } from "../configuration.js"

export const previewLanguageTagCommand = {
	command: "inlang.previewLanguageTag",
	title: "Inlang: Change preview language tag",
	register: vscode.commands.registerCommand,
	callback: async () => {
		const settings = state().project?.settings()
		const selectedTag = await vscode.window.showQuickPick(settings.languageTags, {
			placeHolder: "Select a language",
		})

		if (!selectedTag) {
			return
		}

		await updateSetting("previewLanguageTag", selectedTag)

		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
		CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire()
		CONFIGURATION.EVENTS.ON_DID_PREVIEW_LANGUAGE_TAG_CHANGE.fire(selectedTag)
	},
}
