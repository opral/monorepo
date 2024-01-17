import * as vscode from "vscode"
import { handleTreeSelection, type ProjectViewNode } from "../utilities/project/project.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export const openProjectCommand = {
	command: "inlang.openProject",
	title: "Inlang: Open project",
	register: vscode.commands.registerCommand,
	callback: async (node: ProjectViewNode, nodeishFs: NodeishFilesystem) => {
		await handleTreeSelection({ selectedNode: node, nodeishFs })
	},
}
