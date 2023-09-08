import * as vscode from "vscode"

/** Prompts user to reload editor window in order for configuration change to take effect. */
export const promptToReloadWindow = () => {
	const action = "Reload"

	vscode.window
		.showInformationMessage(
			`To apply changes to the inlang configuration, please reload the window.`,
			action,
		)
		.then((selectedAction) => {
			if (selectedAction === action) {
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			}
		})
}
