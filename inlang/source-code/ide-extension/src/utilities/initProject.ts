import { setState } from "../state.js"
import { createInlangConfigFile } from "./createInlangConfigFile.js"
import { loadProject, type InlangProject } from "@inlang/sdk"
import * as vscode from "vscode"
import { determineClosestPath } from "./determineClosestPath.js"
// TODO add a project UUID to the tele.groups internal #196
// import { isInWorkspaceRecommendation } from "./recommendation.js"
import { telemetry } from "../services/telemetry/implementation.js"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import { _import } from "./import/_import.js"
import { tryCatch } from "@inlang/result"
import fs from "node:fs/promises"
import { normalizePath } from "@lix-js/fs"
import { id } from "../../marketplace-manifest.json"
import { openRepository, findRepoRoot } from "@lix-js/client"

// Helper Functions
export function getActiveTextEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor
}

export async function initProject(args: {
	workspaceFolder: vscode.WorkspaceFolder
	gitOrigin: string | undefined
}): Promise<{ project?: InlangProject; error?: Error }> {
	const possibleInlangProjectPaths = [
		...(await vscode.workspace.findFiles("*.inlang/settings.json")),
		// remove after migration
		...(await vscode.workspace.findFiles("project.inlang.json")),
	]

	// if no settings file is found
	if (possibleInlangProjectPaths.length === 0) {
		// Try to auto config
		await createInlangConfigFile({ workspaceFolder: args.workspaceFolder })
	}

	// Load project
	const activeTextEditor = getActiveTextEditor()
	if (!activeTextEditor) {
		return { project: undefined, error: new Error("No active text editor found – aborting.") }
	}

	const closestProjectFilePath = determineClosestPath({
		options: possibleInlangProjectPaths.map((uri) => uri.path),
		to: activeTextEditor.document.uri.path,
	})
	const closestProjectFilePathUri = vscode.Uri.parse(closestProjectFilePath)
	const closestProjectFilePathUriNormalized = normalizePath(closestProjectFilePathUri.fsPath)
	// TODO add a project UUID to the tele.groups internal #196
	// 	if (args.gitOrigin) {
	// 		telemetry.groupIdentify({
	// 			groupType: "repository",
	// 			groupKey: args.gitOrigin,
	// 			properties: {
	// 				name: args.gitOrigin,
	// 				isInWorkspaceRecommendation: await isInWorkspaceRecommendation({
	// 					workspaceFolder: args.workspaceFolder,
	// 				}),
	// 			},
	// 		})
	// 	}

	// REMOVE THIS HARDCODED ASSUMPTION FOR MULTI PROJECT SUPPORT
	// Has been implemented for https://github.com/opral/monorepo/pull/1762
	if (
		(closestProjectFilePathUriNormalized.endsWith(".inlang/settings.json") === false ||
			closestProjectFilePathUriNormalized.endsWith("project.inlang.json") === false) === false
	) {
		throw new Error("INTERNAL BUG 29j3d. Please report this to the inlang team.")
	}

	const workspacePath = args.workspaceFolder.uri.fsPath
	const nodeishFs = createFileSystemMapper(workspacePath, fs)
	const projectPath = closestProjectFilePathUriNormalized.includes(".inlang/settings.json")
		? // */lucky-elephant.inlang/settings.json -> */lucky-elephant.inlang
		  closestProjectFilePathUriNormalized.replace("/settings.json", "")
		: // */project.inlang.json -> */project.inlang
		  closestProjectFilePathUriNormalized.replace(".json", "")

	const repoRoot = await findRepoRoot({ nodeishFs, path: projectPath })
	const repo = await openRepository(repoRoot || workspacePath, { nodeishFs })

	const { data: project, error } = await tryCatch(() =>
		loadProject({
			projectPath,
			repo,
			_import: _import(workspacePath),
			appId: id,
		})
	)

	if (error) {
		console.error(error)
		// No error message because that gets handled in createInlang
		return { project: undefined, error }
	}

	if (project.id) {
		telemetry.groupIdentify({
			groupType: "project",
			groupKey: project.id,
		})
	}

	telemetry.capture({
		event: "IDE-EXTENSION loaded project",
		properties: {
			errors: project.errors(),
		},
	})

	setState({
		project,
	})

	return { project, error: undefined }
}
