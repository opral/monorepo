import { debounce } from "throttle-debounce"
import { setState } from "../state.js"
import { promptToReloadWindow } from "./promptToReload.js"
import { migrateConfigFile } from "./migrateConfigFile.js"
import { createInlangConfigFile } from "./createInlangConfigFile.js"
import { loadProject, type InlangProject } from "@inlang/sdk"
import * as vscode from "vscode"
import { determineClosestPath } from "./determineClosestPath.js"
import { isInWorkspaceRecommendation } from "./recommendation.js"
import { telemetry } from "../services/telemetry/implementation.js"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import { _import } from "./import/_import.js"
import type { TelemetryEvents } from "../services/telemetry/events.js"
import { tryCatch } from "@inlang/result"

// Constants
export const SETTINGS_FILE_NAME = "project.inlang.json"

// Helper Functions
export function getActiveTextEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor
}

export async function initProject(args: {
	workspaceFolder: vscode.WorkspaceFolder
	gitOrigin: string | undefined
}): Promise<{ project?: InlangProject; error?: Error }> {
	// if no settings file is found
	if ((await vscode.workspace.findFiles(SETTINGS_FILE_NAME)).length === 0) {
		// Try to migrate
		await migrateConfigFile(
			args.workspaceFolder,
			(args.workspaceFolder + "project.inlang.json") as unknown as vscode.Uri
		)

		// Try to auto config
		await createInlangConfigFile({ workspaceFolder: args.workspaceFolder })
	}

	// Load project
	const activeTextEditor = getActiveTextEditor()
	if (!activeTextEditor) {
		return { project: undefined, error: new Error("No active test editor found – aborting.") }
	}

	const closestProjectFilePath = determineClosestPath({
		options: (await vscode.workspace.findFiles(SETTINGS_FILE_NAME)).map((uri) => uri.path),
		to: activeTextEditor.document.uri.path,
	})
	const closestProjectFilePathUri = vscode.Uri.parse(closestProjectFilePath)

	if (args.gitOrigin) {
		telemetry.groupIdentify({
			groupType: "repository",
			groupKey: args.gitOrigin,
			properties: {
				name: args.gitOrigin,
				isInWorkspaceRecommendation: await isInWorkspaceRecommendation({
					workspaceFolder: args.workspaceFolder,
				}),
			},
		})
	}

	const { data: project, error } = await tryCatch(() =>
		loadProject({
			settingsFilePath: closestProjectFilePathUri.fsPath,
			nodeishFs: createFileSystemMapper(args.workspaceFolder.uri.fsPath),
			_import: _import(args.workspaceFolder.uri.fsPath),
			_capture(id, props) {
				telemetry.capture({
					event: id as TelemetryEvents,
					properties: props,
				})
			},
		})
	)
	telemetry.capture({
		event: "IDE-EXTENSION loaded project",
	})

	if (error) {
		console.error(error)
		// No error message because that gets handled in createInlang
		return { project: undefined, error }
	}

	const loadMessages = async () => {
		setState({
			project,
		})
	}

	await loadMessages()

	// Debounce future loading of resources
	const debouncedLoadMessages = debounce(1000, loadMessages)

	// Register event listeners
	vscode.workspace.onDidChangeTextDocument(() => {
		debouncedLoadMessages()
	})

	// Watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(args.workspaceFolder, "project.inlang.json")
	)
	// Listen for changes in the config file
	watcher.onDidChange(() => {
		promptToReloadWindow()
	})

	return { project, error: undefined }
}
