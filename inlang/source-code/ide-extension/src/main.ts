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
import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { gettingStartedView } from "./utilities/getting-started/gettingStarted.js"
import { closestInlangProject } from "./utilities/project/closestInlangProject.js"

// TODO #1844 CLEARIFY Felix  - why is this important now? The lifecycle of the information flow is crutial now that we deal with so many files and watch on so many files

// Entry Point
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const gitOrigin = await getGitOrigin()
		telemetryCapture("IDE-EXTENSION activated")

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
		// TODO #1844 CLEARIFY Felix the main function may not completed the initialization when we arrived here if the project got migrated
		await main({ context, gitOrigin, workspaceFolder, nodeishFs })
		msg("inlang's extension activated", "info")
	} catch (error) {
		handleError(error)
	}
}

// Main Function
async function main(args: {
	context: vscode.ExtensionContext
	gitOrigin: string | undefined
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}): Promise<void> {
	if (state().projectsInWorkspace.length > 0) {
		vscode.commands.executeCommand("setContext", "inlang:hasProjectInWorkspace", true)

		// find the closest project to the workspace
		const closestProjectToWorkspace = await closestInlangProject({
			workingDirectory: normalizePath(args.workspaceFolder.uri.fsPath),
			projects: state().projectsInWorkspace,
		})

		setState({
			...state(),
			selectedProjectPath:
				closestProjectToWorkspace?.projectPath || state().projectsInWorkspace[0]?.projectPath || "",
		})

		await projectView({ ...args })
		await messageView({ ...args })
		await errorView({ ...args })

		registerExtensionComponents(args)
		// TODO: Replace by reactive settings API?
		setupFileSystemWatcher(args)
		handleInlangErrors()
	} else {
		await gettingStartedView()
	}
}

function setupFileSystemWatcher(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
	gitOrigin: string | undefined
}) {
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(
			args.workspaceFolder,
			// TODO #1844 CLEARIFY Felix we don't await the main function here (CHECK does this still trigger main()?)
			state().selectedProjectPath || CONFIGURATION.FILES.PROJECT
		)
	)

	watcher.onDidChange(async () => {
		// reload project
		await main({
			context: args.context,
			gitOrigin: args.gitOrigin,
			workspaceFolder: args.workspaceFolder,
			nodeishFs: args.nodeishFs,
		})
	})
}

function registerExtensionComponents(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
}) {
	args.context.subscriptions.push(
		...Object.values(CONFIGURATION.COMMANDS).map((c) => c.register(c.command, c.callback as any))
	)

	const additionalSelectors =
		state().project.customApi()["app.inlang.ideExtension"]?.documentSelectors || []

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: `!${CONFIGURATION.FILES.PROJECT}` },
		...(state().project ? additionalSelectors : []),
	]

	args.context.subscriptions.push(
		// TODO #1844 CLEARIFY Felix shouldn't the state object be registered for later disposal here as well?
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		})
	)

	messagePreview(args)
	propertiesMissingPreview()
	recommendation(args)
	linterDiagnostics(args)
}

function handleInlangErrors() {
	const inlangErrors = state().project.errors() || []
	if (inlangErrors.length > 0) {
		console.error("Inlang VSCode Extension errors:", inlangErrors)
	}
}

// Helper Functions
export function getActiveTextEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor
}
