import * as vscode from "vscode"
import { debounce } from "throttle-debounce"
import { setState, state } from "./state.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { determineClosestPath } from "./utilities/determineClosestPath.js"
import { ExtractMessage } from "./actions/extractMessage.js"
import { msg } from "./utilities/message.js"
import { getGitOrigin, telemetry } from "./services/telemetry/index.js"
import { version } from "../package.json"
import { propertiesMissingPreview } from "./decorations/propertiesMissingPreview.js"
import { promptToReloadWindow } from "./utilities/promptToReload.js"
import { recommendation, isInWorkspaceRecommendation } from "./utilities/recommendation.js"

import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { openInEditorCommand } from "./commands/openInEditor.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { loadProject } from "@inlang/sdk"
import { createFileSystemMapper } from "./utilities/createFileSystemMapper.js"
import { _import } from "./utilities/import/_import.js"
import { tryCatch } from "@inlang/result"
import { createInlangConfigFile } from "./utilities/createInlangConfigFile.js"
import { migrateConfigFile } from "./utilities/migrateConfigFile.js"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const gitOrigin = await getGitOrigin()

		// activation telemetry
		if (gitOrigin) {
			telemetry.groupIdentify({
				groupType: "repository",
				groupKey: gitOrigin,
				properties: {
					name: gitOrigin,
				},
			})
		}
		await telemetry.capture({
			event: "IDE-EXTENSION activated",
			properties: {
				vscode_version: vscode.version,
				version: version,
			},
		})
		// start the ide extension
		await main({ context, gitOrigin })
		msg("inlang's extension activated", "info")
	} catch (error) {
		vscode.window.showErrorMessage((error as Error).message)
		console.error(error)
	}
}

/**
 * The main entry of the extension.
 *
 * This function registers all commands, actions, loads the config etc.
 */
async function main(args: {
	context: vscode.ExtensionContext
	gitOrigin: string | undefined
}): Promise<void> {
	// if no active text editor -> no window is open -> hence dont activate the extension
	const activeTextEditor = vscode.window.activeTextEditor
	if (activeTextEditor === undefined) {
		return
	}
	// checking whether a config file exists -> if not dont start the extension
	const potentialConfigFileUris = await vscode.workspace.findFiles("project.inlang.json")
	if (potentialConfigFileUris.length === 0) {
		console.warn("No project.inlang.json file found.")

		// get workspace folder
		const _workspaceFolder = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri)
		if (!_workspaceFolder) {
			console.warn("No workspace folder found.")
		} else {
			console.info("Creating project.inlang.json file.")
			await createInlangConfigFile({ workspaceFolder: _workspaceFolder })
		}
		return
	}
	const closestProjectFilePath = determineClosestPath({
		options: potentialConfigFileUris.map((uri) => uri.path),
		to: activeTextEditor.document.uri.path,
	})
	const closestProjectFilePathUri = vscode.Uri.parse(closestProjectFilePath)

	// get current workspace
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(closestProjectFilePathUri)
	if (!workspaceFolder) {
		console.warn("No workspace folder found.")
		return
	}

	if (args.gitOrigin) {
		telemetry.groupIdentify({
			groupType: "repository",
			groupKey: args.gitOrigin,
			properties: {
				name: args.gitOrigin,
				isInWorkspaceRecommendation: await isInWorkspaceRecommendation({ workspaceFolder }),
			},
		})
	}

	// watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, "project.inlang.json"),
	)

	const { data: project, error } = await tryCatch(() =>
		loadProject({
			settingsFilePath: closestProjectFilePathUri.fsPath,
			nodeishFs: createFileSystemMapper(workspaceFolder.uri.fsPath),
			_import: _import(workspaceFolder.uri.fsPath),
			_capture(id, props) {
				telemetry.capture({
					// @ts-ignore the events
					event: id,
					properties: props,
				})
			},
		}),
	)
	telemetry.capture({
		event: "IDE-EXTENSION loaded project",
	})

	if (error) {
		console.error(error)
		// no error message because that gets handled in createInlang
		return
	}

	const loadMessages = async () => {
		setState({
			project,
		})
	}

	await loadMessages()

	// debounce future loading of resources
	const debouncedLoadMessages = debounce(1000, loadMessages)

	// register event listeners
	vscode.workspace.onDidChangeTextDocument(() => {
		debouncedLoadMessages()
	})

	// listen for changes in the config file
	watcher.onDidChange(() => {
		promptToReloadWindow()
	})

	// register command
	args.context.subscriptions.push(
		vscode.commands.registerCommand(editMessageCommand.id, editMessageCommand.callback),
		vscode.commands.registerTextEditorCommand(
			extractMessageCommand.id,
			extractMessageCommand.callback,
		),
		vscode.commands.registerCommand(openInEditorCommand.id, openInEditorCommand.callback),
	)

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: "!project.inlang.json" },
		...(state().project.customApi()["app.inlang.ideExtension"]?.documentSelectors || []),
	]
	// register source actions
	args.context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		}),
	)

	// register decorations
	messagePreview(args)

	// properties missing decoration in project.inlang.json
	propertiesMissingPreview()

	// add inlang extension to recommended extensions
	recommendation({ workspaceFolder })

	// linter diagnostics
	linterDiagnostics(args)

	// try to delete old config file (inlang.config.js)
	// TODO: use this function in a few months (Nov/Dec 2023)
	// await deleteOldConfigFile()

	// migrate project config from inlang.config.js to project.inlang.json
	await migrateConfigFile(workspaceFolder, closestProjectFilePathUri)

	// log inlang errors in the debugging console
	const inlangErrors = state().project.errors()
	if (inlangErrors.length > 0) {
		console.error("Inlang VSCode Extension errors:", inlangErrors)
	}
}

// this method is called when your extension is deactivated
// export function deactivate() {}
