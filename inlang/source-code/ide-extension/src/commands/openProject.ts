import * as vscode from "vscode"
import { handleTreeSelection, type ProjectViewNode } from "../utilities/project/project.js"
import type { FileSystem } from "../utilities/fs/createFileSystemMapper.js"

export const openProjectCommand = {
	command: "sherlock.openProject",
	title: "Sherlock: Open project",
	register: vscode.commands.registerCommand,
	callback: async (
		node: ProjectViewNode,
		fs: FileSystem,
		workspaceFolder: vscode.WorkspaceFolder
	) => {
		await handleTreeSelection({ selectedNode: node, fs, workspaceFolder })
	},
}
