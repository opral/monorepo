import * as vscode from "vscode"
import { debounce } from "throttle-debounce"
import { setState, state } from "./state.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { determineClosestPath } from "./utilities/determineClosestPath.js"
import { setupConfig } from "@inlang/core/config"
import { ExtractMessage } from "./actions/extractMessage.js"
import { msg } from "./utilities/message.js"
import { createInlangEnv, importInlangConfig } from "./services/inlang-environment/index.js"
import { getGitOrigin, telemetry } from "./services/telemetry/index.js"
import { version } from "../package.json"
import { propertiesMissingPreview } from "./decorations/propertiesMissingPreview.js"
import { promptToReloadWindow } from "./utilities/promptToReload.js"
import { coreUsedConfigEvent } from "@inlang/telemetry"
import { recommendation, isDisabledRecommendation } from "./utilities/recommendation.js"
import {
	createInlangConfigFile,
	isDisabledConfigFileCreation,
} from "./utilities/createInlangConfigFile.js"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		await telemetry.capture({
			event: "IDE-EXTENSION activated",
			properties: {
				vscode_version: vscode.version,
				version: version,
				workspaceRecommendation: !(await isDisabledRecommendation()),
				autoConfigFileCreation: !(await isDisabledConfigFileCreation()),
			},
		})
		const gitOrigin = await getGitOrigin()
		telemetry.groupIdentify({
			groupType: "repository",
			groupKey: gitOrigin,
			properties: {
				name: gitOrigin,
			},
		})
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
	const potentialConfigFileUris = await vscode.workspace.findFiles("inlang.config.js")
	if (potentialConfigFileUris.length === 0) {
		console.warn("No inlang.config.js file found.")

		// get workspace folder
		const _workspaceFolder = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri)
		if (!_workspaceFolder) {
			console.warn("No workspace folder found.")
		} else {
			console.log("Creating inlang.config.js file.")
			await createInlangConfigFile({ workspaceFolder: _workspaceFolder })
		}
		return
	}
	const closestConfigPath = determineClosestPath({
		options: potentialConfigFileUris.map((uri) => uri.fsPath),
		to: activeTextEditor.document.uri.fsPath,
	})

	// get current workspace
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(closestConfigPath))
	if (!workspaceFolder) {
		console.warn("No workspace folder found.")
		return
	}

	// watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, "inlang.config.js"),
	)

	const module = await importInlangConfig(closestConfigPath)
	const env = createInlangEnv({ workspaceFolder })

	const config = await setupConfig({ module, env })

	telemetry.capture({
		event: coreUsedConfigEvent.name,
		properties: coreUsedConfigEvent.properties(config),
	})

	const loadResources = async () => {
		const resources = await config.readResources({ config })
		setState({
			config,
			resources,
		})
	}

	await loadResources()

	// debounce future loading of resources
	const debouncedLoadResources = debounce(1000, loadResources)

	// register event listeners
	vscode.workspace.onDidChangeTextDocument(() => {
		debouncedLoadResources()
	})

	// listen for changes in the config file
	watcher.onDidChange(() => {
		promptToReloadWindow()
	})

	// register command
	args.context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			extractMessageCommand.id,
			extractMessageCommand.callback,
		),
	)

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: "!inlang.config.js" },
		...(state().config.ideExtension?.documentSelectors || []), // an empty array as fallback
	]
	// register source actions
	args.context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		}),
	)

	// register decorations
	messagePreview({ activeTextEditor, context: args.context })

	// properties missing decoration in inlang.config.js
	propertiesMissingPreview({ activeTextEditor })

	// add inlang extension to recommended extensions
	recommendation({ workspaceFolder })
}

// this method is called when your extension is deactivated
// export function deactivate() {}
