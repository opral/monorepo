import * as vscode from "vscode"
import { msg } from "./utilities/messages/msg.js"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { handleError } from "./utilities/utils.js"
import { CONFIGURATION } from "./configuration.js"
import { projectView } from "./utilities/project/project.js"
import { setState, state } from "./utilities/state.js"
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
import { recommendationBannerView } from "./utilities/recommendation/recommendation.js"
import { telemetry } from "./services/telemetry/implementation.js"
import { version } from "../package.json"
import { statusBar } from "./utilities/settings/statusBar.js"
//import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"

// Entry Point
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Sentry Error Handling
	//initErrorMonitoring()

	try {
		vscode.commands.executeCommand("setContext", "inlang:hasProjectInWorkspace", false)
		vscode.commands.executeCommand("setContext", "inlang:showRecommendationBanner", false)
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

		if (!workspaceFolder) {
			console.warn("No workspace folder found.")
			return
		}

		telemetry.capture({
			event: "IDE-EXTENSION activated",
			properties: {
				vscode_version: vscode.version,
				version,
				platform: process.platform,
			},
		})

		const nodeishFs = createFileSystemMapper(normalizePath(workspaceFolder.uri.fsPath), fs)

		try {
			const projectsList = await listProjects(nodeishFs, normalizePath(workspaceFolder.uri.fsPath))
			setState({ ...state(), projectsInWorkspace: projectsList })
		} catch (error) {
			handleError(error)
			return
		}

		await main({ context, workspaceFolder, nodeishFs })
		msg("inlang's extension activated", "info")
	} catch (error) {
		handleError(error)
	}
}

// Main Function
async function main(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}): Promise<void> {
	if (state().projectsInWorkspace.length > 0) {
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

		vscode.commands.executeCommand("setContext", "inlang:hasProjectInWorkspace", true)

		await recommendationBannerView(args)
		await projectView(args)
		await messageView(args)
		await errorView(args)
		await statusBar(args)

		registerExtensionComponents(args)
		// TODO: Replace by reactive settings API?
		setupFileSystemWatcher(args)
		handleInlangErrors()

		return
	} else {
		await gettingStartedView()
	}
}

function setupFileSystemWatcher(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}) {
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(
			args.workspaceFolder,
			state().selectedProjectPath || CONFIGURATION.FILES.PROJECT
		)
	)

	watcher.onDidChange(async () => {
		// reload project
		await main({
			context: args.context,
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
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		})
	)

	messagePreview(args)
	linterDiagnostics(args)
}

function handleInlangErrors() {
	const inlangErrors = state().project.errors() || []
	if (inlangErrors.length > 0) {
		console.error("Inlang VSCode Extension errors:", inlangErrors)
	}
}
