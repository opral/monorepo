import * as vscode from "vscode"
import { type ProjectNode } from "../utilities/project/project.js"
import * as path from "node:path"

export const openSettingsFileCommand = {
	command: "inlang.openSettingsFile",
	title: "Inlang: Open settings file",
	register: vscode.commands.registerCommand,
	callback: async (node: ProjectNode) => {
		const settingsFile = vscode.Uri.file(path.join(node.path, "settings.json"))
		await vscode.window.showTextDocument(settingsFile)
	},
}
