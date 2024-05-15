import * as vscode from "vscode"
import { openRepository } from "@lix-js/client"
import { createNewProject } from "@inlang/sdk"
import { defaultProjectSettings } from "@inlang/sdk"
import { normalizePath } from "@lix-js/fs"
import fs from "node:fs/promises"
import { createFileSystemMapper } from "../fs/createFileSystemMapper.js"

/**
 * Creates a new project in the workspace folder.
 * @param args - The arguments for the command.
 * @param args.workspaceFolderPath - The path to the workspace folder.
 */
export async function createNewProjectHandler(args: { workspaceFolderPath: string }) {
	try {
		const workspaceFolderPath = args.workspaceFolderPath
		const nodeishFs = createFileSystemMapper(normalizePath(workspaceFolderPath), fs)

		// Prefix the workspace folder path with the file protocol file://
		const workspaceFolderUri = `file://${workspaceFolderPath}`

		// The path to the project file
		const projectPath = normalizePath(`${workspaceFolderPath}/yourProjectName.inlang`)

		const repo = await openRepository(workspaceFolderUri, { nodeishFs })

		if (!repo) {
			vscode.window.showErrorMessage(
				"Failed to open repository. Please make sure you have a valid git repository. You can create a new git repository by running 'git init' in the workspace folder."
			)
		}

		// Use the default project settings
		const projectSettings = defaultProjectSettings

		await createNewProject({ projectPath, repo, projectSettings })
		vscode.commands.executeCommand("workbench.action.reloadWindow")
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to create new project: ${error.message}`)
	}
}
