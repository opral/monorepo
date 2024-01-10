import * as vscode from "vscode"
import { handleTreeSelection, type ProjectNode } from "../utilities/project/project.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export const openProjectCommand = {
	command: "inlang.openProject",
	title: "Inlang: Open project",
	register: vscode.commands.registerCommand,
	callback: async (
		node: ProjectNode,
		nodeishFs: NodeishFilesystem,
		workspaceFolder: vscode.WorkspaceFolder
	) => {
		await handleTreeSelection(node, nodeishFs, workspaceFolder)
	},
}
