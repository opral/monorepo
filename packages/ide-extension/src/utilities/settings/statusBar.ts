import * as vscode from "vscode"
import { CONFIGURATION } from "../../configuration.js"
import { getPreviewLocale } from "../locale/getPreviewLocale.js"

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
		CONFIGURATION.EVENTS.ON_DID_PREVIEW_LOCALE_CHANGE.event(() => {
			showStatusBar()
		})
	)

	showStatusBar()
}

export const showStatusBar = async () => {
	if (statusBarItem) {
		statusBarItem.dispose()
	}

	const previewLanguageTag = await getPreviewLocale()

	if (!previewLanguageTag) return

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
	statusBarItem.command = "sherlock.previewLanguageTag"
	statusBarItem.text = `Sherlock: ${previewLanguageTag}`
	statusBarItem.tooltip = "Switch preview language"
	statusBarItem.show()
}
