import * as vscode from "vscode"
import { handleTreeSelection, type ProjectViewNode } from "../utilities/project/project.js"

export const openProjectCommand = {
	command: "sherlock.openProject",
	title: "Sherlock: Open project",
	register: vscode.commands.registerCommand,
	callback: async (
		node: ProjectViewNode,
		fs: typeof import("node:fs/promises"),
		workspaceFolder: vscode.WorkspaceFolder
	) => {
		await handleTreeSelection({ selectedNode: node, fs, workspaceFolder })
	},
}
