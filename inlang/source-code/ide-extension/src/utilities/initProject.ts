import { setState } from "../state.js"
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
import { CONFIGURATION } from "../configuration.js"

// Helper Functions
export function getActiveTextEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor
}

export async function initProject(args: {
	workspaceFolder: vscode.WorkspaceFolder
	gitOrigin: string | undefined
}): Promise<{ project?: InlangProject; error?: Error }> {
	// if no settings file is found
	if ((await vscode.workspace.findFiles(CONFIGURATION.FILES.PROJECT)).length === 0) {
		// Try to auto config
		await createInlangConfigFile({ workspaceFolder: args.workspaceFolder })
	}

	// Load project
	const activeTextEditor = getActiveTextEditor()
	if (!activeTextEditor) {
		return { project: undefined, error: new Error("No active test editor found – aborting.") }
	}

	const closestProjectFilePath = determineClosestPath({
		options: (await vscode.workspace.findFiles(CONFIGURATION.FILES.PROJECT)).map((uri) => uri.path),
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
		properties: {
			errors: project?.errors(),
		},
	})

	if (error) {
		console.error(error)
		// No error message because that gets handled in createInlang
		return { project: undefined, error }
	}

	setState({
		project,
	})

	return { project, error: undefined }
}
