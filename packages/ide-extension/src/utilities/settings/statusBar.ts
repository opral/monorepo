import * as vscode from "vscode"
import { state } from "../state.js"
import { getSetting } from "./index.js"
import { CONFIGURATION } from "../../configuration.js"

let statusBar: vscode.StatusBarItem | undefined = undefined

let subscribed = false

export const showStatusBar = async (args: { context: vscode.ExtensionContext }) => {
	if (!subscribed) {
		// when project view changes, update webview
		args.context.subscriptions.push(
			CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event(() => {
				showStatusBar(args)
			})
		)
		// when project view changes, update webview
		args.context.subscriptions.push(
			CONFIGURATION.EVENTS.ON_DID_PREVIEW_LANGUAGE_TAG_CHANGE.event(() => {
				showStatusBar(args)
			})
		)
		subscribed = true
	}

	if (statusBar) {
		statusBar.dispose()
	}
	const settings = state().project?.settings()
	const sourceLanguageTag = settings?.sourceLanguageTag

	// TODO: Better fix
	if (!sourceLanguageTag) return
	const previewLanguageTag = await getSetting("previewLanguageTag")

	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
	statusBar.command = "inlang.previewLanguageTag"

	const preferredLanguageTag = previewLanguageTag.length ? previewLanguageTag : sourceLanguageTag

	statusBar.text = `Inlang: ${preferredLanguageTag}`
	statusBar.tooltip = "Switch preview language"
	statusBar.show()
}
