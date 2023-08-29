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
import { recommendation, isDisabledRecommendation } from "./utilities/recommendation.js"
// import {
// 	createInlangConfigFile,
// 	isDisabledConfigFileCreation,
// } from "./utilities/createInlangConfigFile.js"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { openInEditorCommand } from "./commands/openInEditor.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { openInlangProject, tryCatch } from "@inlang/app"
import { createFileSystemMapper } from "./utilities/createFileSystemMapper.js"
import { _import } from "./utilities/import/_import.js"
import { promises as fs } from "node:fs"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		// activation telemetry
		await telemetry.capture({
			event: "IDE-EXTENSION activated",
			properties: {
				vscode_version: vscode.version,
				version: version,
				workspaceRecommendation: !(await isDisabledRecommendation()),
				// autoConfigFileCreation: !(await isDisabledConfigFileCreation()),
			},
		})
		const gitOrigin = await getGitOrigin()
		if (gitOrigin) {
			telemetry.groupIdentify({
				groupType: "repository",
				groupKey: gitOrigin,
				properties: {
					name: gitOrigin,
				},
			})
		}
		msg("Inlang extension activated.", "info")
		// start the ide extension
		main({ context })
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
async function main(args: { context: vscode.ExtensionContext }): Promise<void> {
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
			// await createInlangConfigFile({ workspaceFolder: _workspaceFolder })
		}
		return
	}
	const closestConfigPath = determineClosestPath({
		options: potentialConfigFileUris.map((uri) => uri.path),
		to: activeTextEditor.document.uri.path,
	})
	const closestConfigPathUri = vscode.Uri.parse(closestConfigPath)

	// get current workspace
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(closestConfigPathUri)
	if (!workspaceFolder) {
		console.warn("No workspace folder found.")
		return
	}

	// watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, "project.inlang.json"),
	)

	const { data: inlang, error } = await tryCatch(() =>
		openInlangProject({
			configPath: closestConfigPathUri.fsPath,
			nodeishFs: fs,
			_import: _import(closestConfigPathUri.fsPath),
		}),
	)

	if (error) {
		console.error(error)
		// no error message because that gets handled in createInlang
		return
	}

	const loadMessages = async () => {
		setState({
			inlang,
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
		...(state().inlang.appSpecificApi()["inlang.app.ideExtension"]?.documentSelectors || []),
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
}

// this method is called when your extension is deactivated
// export function deactivate() {}
