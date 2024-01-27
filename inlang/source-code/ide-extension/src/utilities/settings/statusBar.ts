import * as vscode from "vscode"
import { state } from "../state.js"
import { getSetting } from "./index.js"

let statusBar: vscode.StatusBarItem | undefined = undefined

export const showStatusBar = async () => {
	if (statusBar) {
		statusBar.dispose()
	}

	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
	statusBar.command = "inlang.previewLanguageTag"

	const previewLanguageTag = await getSetting("previewLanguageTag")
	const settings = state().project?.settings()
	const preferredLanguageTag = previewLanguageTag.length
		? previewLanguageTag
		: settings.sourceLanguageTag

	statusBar.text = `Language: ${preferredLanguageTag}`
	statusBar.show()
}
