import * as vscode from "vscode"

export const msg = (
	message: string,
	type?: "info" | "warn" | "error",
	position?: "statusBar" | "notification",
	alignment?: vscode.StatusBarAlignment,
	duration?: number,
) => {
	// Set default values for alignment and duration
	type = type || "info"
	alignment = alignment || vscode.StatusBarAlignment.Left
	duration = duration || 3000
	position = position || "statusBar"

	// status bar
	if (position === "statusBar") {
		// Show status bar message
		const statusBarItem = vscode.window.createStatusBarItem(alignment, 1000)
		if (type === "error") {
			statusBarItem.color = new vscode.ThemeColor("statusBarItem.errorBackground")
		}
		if (type === "warn") {
			statusBarItem.color = new vscode.ThemeColor("statusBarItem.warningBackground")
		}
		statusBarItem.text = message
		statusBarItem.show()

		setTimeout(() => {
			statusBarItem.hide()
		}, duration)
	}

	// notification
	if (position === "notification") {
		if (type === "error") {
			vscode.window.showErrorMessage(message)
		}
		if (type === "warn") {
			vscode.window.showWarningMessage(message)
		}
		if (type === "info") {
			vscode.window.showInformationMessage(message)
		}
	}
}
