import * as vscode from "vscode"
import { loadProjectInMemory, newProject, saveProjectToDirectory } from "@inlang/sdk2"
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

		// The path to the project directory
		const projectPath = normalizePath(`${workspaceFolderPath}/project.inlang`)

		// Create a new project in memory
		const project = await loadProjectInMemory({
			blob: await newProject(),
		})

		// Save the project blob as a directory
		await saveProjectToDirectory({
			fs: nodeishFs,
			project,
			path: projectPath,
		})

		// Reload the window after creating and saving the project
		vscode.commands.executeCommand("workbench.action.reloadWindow")
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to create new project: ${error.message}`)
		console.log(error)
	}
}
