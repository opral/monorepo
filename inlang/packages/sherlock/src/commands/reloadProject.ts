import * as vscode from "vscode"
import { handleError } from "../utilities/utils.js"
import { state } from "../utilities/state.js"
import { main } from "../main.js"
import { createFileSystemMapper } from "../utilities/fs/createFileSystemMapper.js"
import fs from "node:fs/promises"

export const reloadProjectCommand = {
	command: "sherlock.reloadProject",
	title: "Sherlock: Reload project",
	register: vscode.commands.registerCommand,
	callback: async () => {
		try {
			console.log("Reloading project...")
			
			// Get current workspace
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
			if (!workspaceFolder) {
				console.warn("No workspace folder found.")
				return
			}

			// Create file system mapper
			const mappedFs = createFileSystemMapper(workspaceFolder.uri.fsPath, fs)
			
			// Get context from extension
			const extension = vscode.extensions.getExtension("inlang.vs-code-extension")
			if (!extension) {
				throw new Error("Could not find Sherlock extension")
			}
			
			// Get API from extension (returns context)
			const api = await extension.activate()
			if (!api?.context) {
				throw new Error("Could not get extension context")
			}

			// Update project if we have a selected project
			if (state().selectedProjectPath) {
				await main({ context: api.context, workspaceFolder, fs: mappedFs })
				console.log("Project reloaded successfully")
			} else {
				console.warn("No project selected, nothing to reload")
			}
		} catch (error) {
			console.error("Failed to reload project:", error)
			handleError(error)
		}
	}
}