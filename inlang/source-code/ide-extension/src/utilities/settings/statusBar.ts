import * as vscode from "vscode"
import { state } from "../state.js"
import { getSetting } from "./index.js"
import { CONFIGURATION } from "../../configuration.js"

let statusBarItem: vscode.StatusBarItem | undefined = undefined

export const statusBar = async (args: { context: vscode.ExtensionContext }) => {
	// when project view changes, status bar
	args.context.subscriptions.push(
		CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event(() => {
			showStatusBar()
		})
	)
	// when value of previewLanguageTag changes, update status bar
	args.context.subscriptions.push(
		CONFIGURATION.EVENTS.ON_DID_PREVIEW_LANGUAGE_TAG_CHANGE.event(() => {
			showStatusBar()
		})
	)

	showStatusBar()
}

export const showStatusBar = async () => {
	if (statusBarItem) {
		statusBarItem.dispose()
	}

	const settings = state().project?.settings()
	const sourceLanguageTag = settings?.sourceLanguageTag

	if (!sourceLanguageTag) return
	const previewLanguageTag = (await getSetting("previewLanguageTag")) || ""

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
	statusBarItem.command = "sherlock.previewLanguageTag"

	const preferredLanguageTag = previewLanguageTag.length ? previewLanguageTag : sourceLanguageTag

	statusBarItem.text = `Sherlock: ${preferredLanguageTag}`
	statusBarItem.tooltip = "Switch preview language"
	statusBarItem.show()
}
