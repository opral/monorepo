import * as vscode from "vscode"
import fetch from "node-fetch"
import { debounce } from "throttle-debounce"
import { setState, state } from "./state.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { determineClosestPath } from "./utils/determineClosestPath.js"
import { InlangConfigModule, setupConfig } from "@inlang/core/config"
import { ExtractMessage } from "./actions/extractMessage.js"
import { createFileSystemMapper } from "./utils/createFileSystemMapper.js"
import { initialize$import } from "@inlang/core/environment"
import { msg } from "./utils/message.js"
import { telemetryNode } from "@inlang/telemetry"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		console.log("hieeessssswweww2")
		telemetryNode.capture({
			distinctId: "unknown",
			event: "IDE-EXTENSION activated",
		})
		msg("Inlang extension activated.", "info")

		// start the extension
		main({ context })
		// in case the active window changes -> restart the extension
		// (could be improved in the future for performance reasons
		// by detecting whether the closest config differs. For now,
		// it's easier to restart the application each time.)
		vscode.window.onDidChangeActiveTextEditor(() => {
			// in case of running subscriptions -> dispose them (no commands will be shown anymore in the IDE)
			for (const subscription of context.subscriptions) {
				subscription.dispose()
			}
			// restart extension
			main({ context })
		})
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
	const potentialConfigFileUris = await vscode.workspace.findFiles("**/inlang.config.js")
	if (potentialConfigFileUris.length === 0) {
		return
	}
	const closestConfigPath = determineClosestPath({
		options: potentialConfigFileUris.map((uri) => uri.path),
		to: activeTextEditor.document.uri.path,
	})

	// get current workspace
	const workspace = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(closestConfigPath))
	if (!workspace) {
		return
	}

	// initialize inlang core and resources for current workspace
	const fileSystemMapper = createFileSystemMapper(vscode.workspace.fs, workspace.uri)

	// watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspace, "**/inlang.config.js"),
	)

	const env = { $fs: fileSystemMapper, $import: initialize$import({ fs: fileSystemMapper, fetch }) }

	const module = (await import(closestConfigPath)) as InlangConfigModule
	const config = await setupConfig({ module, env })

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

	const documentSelectors = [
		{ language: "javascript", pattern: "!**/inlang.config.js" },
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
}

/** Prompts user to reload editor window in order for configuration change to take effect. */
const promptToReloadWindow = () => {
	const action = "Reload"

	vscode.window
		.showInformationMessage(
			`To apply changes to the inlang configuration, please reload the window.`,
			action,
		)
		.then((selectedAction) => {
			if (selectedAction === action) {
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			}
		})
}

// this method is called when your extension is deactivated
// export function deactivate() {}
