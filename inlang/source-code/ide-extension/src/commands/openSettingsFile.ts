import * as vscode from "vscode"
import { type ProjectViewNode } from "../utilities/project/project.js"
import * as path from "node:path"

export const openSettingsFileCommand = {
	command: "sherlock.openSettingsFile",
	title: "Sherlock: Open settings file",
	register: vscode.commands.registerCommand,
	callback: async (node: ProjectViewNode) => {
		const settingsFile = vscode.Uri.file(path.join(node.path, "settings.json"))
		await vscode.window.showTextDocument(settingsFile)
	},
}
