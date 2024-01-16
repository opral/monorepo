import * as vscode from "vscode"
import { msg } from "./utilities/messages/msg.js"
import { getGitOrigin } from "./services/telemetry/index.js"
import { propertiesMissingPreview } from "./decorations/propertiesMissingPreview.js"
import { recommendation } from "./utilities/settings/recommendation.js"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { handleError, telemetryCapture } from "./utilities/utils.js"
import { CONFIGURATION } from "./configuration.js"
import { projectView } from "./utilities/project/project.js"
import { setState, state } from "./state.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { ExtractMessage } from "./actions/extractMessage.js"
import { errorView } from "./utilities/errors/errors.js"
import { messageView } from "./utilities/messages/messages.js"
import { listProjects } from "@inlang/sdk"
import { createFileSystemMapper } from "./utilities/fs/createFileSystemMapper.js"
import fs from "node:fs/promises"
import { normalizePath } from "@lix-js/fs"

// Entry Point
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const gitOrigin = await getGitOrigin()
		telemetryCapture("IDE-EXTENSION activated")

		await main({ context, gitOrigin })
		msg("inlang's extension activated", "info")
	} catch (error) {
		handleError(error)
	}
}

// Main Function
async function main(args: {
	context: vscode.ExtensionContext
	gitOrigin: string | undefined
}): Promise<void> {
	vscode.commands.executeCommand("setContext", "inlang:hasProjectInWorkspace", false)
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

	if (!workspaceFolder) {
		console.warn("No workspace folder found.")
		return
	}

	const nodeishFs = createFileSystemMapper(normalizePath(workspaceFolder.uri.fsPath), fs)

	try {
		const projectsList = await listProjects(nodeishFs, normalizePath(workspaceFolder.uri.fsPath))
		setState({ ...state(), projectsInWorkspace: projectsList })
	} catch (error) {
		handleError(error)
		return
	}

	if (state().projectsInWorkspace.length > 0) {
		vscode.commands.executeCommand("setContext", "inlang:hasProjectInWorkspace", true)
	}

	await projectView({ ...args, workspaceFolder, nodeishFs })
	await messageView({ ...args })
	await errorView({ ...args })

	setupFileSystemWatcher(workspaceFolder, args)
	registerExtensionComponents(workspaceFolder, args)
	handleInlangErrors()
}

function setupFileSystemWatcher(
	workspaceFolder: vscode.WorkspaceFolder,
	args: { context: vscode.ExtensionContext; gitOrigin: string | undefined }
) {
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, CONFIGURATION.FILES.PROJECT)
	)

	watcher.onDidChange(() => main(args))
}

function registerExtensionComponents(
	workspaceFolder: vscode.WorkspaceFolder,
	args: { context: vscode.ExtensionContext; gitOrigin: string | undefined }
) {
	args.context.subscriptions.push(
		...Object.values(CONFIGURATION.COMMANDS).map((c) => c.register(c.command, c.callback as any))
	)

	const additionalSelectors =
		state().project?.customApi()["app.inlang.ideExtension"]?.documentSelectors || []

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: `!${CONFIGURATION.FILES.PROJECT}` },
		...(state().project ? additionalSelectors : []),
	]

	args.context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		})
	)

	messagePreview(args)
	propertiesMissingPreview()
	recommendation({ workspaceFolder })
	linterDiagnostics(args)
}

function handleInlangErrors() {
	const inlangErrors = state().project?.errors() || []
	if (inlangErrors.length > 0) {
		console.error("Inlang VSCode Extension errors:", inlangErrors)
	}
}

// Helper Functions
export function getActiveTextEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor
}
