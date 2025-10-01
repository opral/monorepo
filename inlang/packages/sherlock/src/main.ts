import * as vscode from "vscode"
import { handleError } from "./utilities/utils.js"
import { CONFIGURATION } from "./configuration.js"
import { projectView } from "./utilities/project/project.js"
import { safeState, setState, state } from "./utilities/state.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { ExtractMessage } from "./actions/extractMessage.js"
import { errorView } from "./utilities/errors/errors.js"
import { messageView } from "./utilities/messages/messages.js"
import { createFileSystemMapper, type FileSystem } from "./utilities/fs/createFileSystemMapper.js"
import fs from "node:fs/promises"
import { gettingStartedView } from "./utilities/getting-started/gettingStarted.js"
import { closestInlangProject } from "./utilities/project/closestInlangProject.js"
import { recommendationBannerView } from "./utilities/recommendation/recommendation.js"
import { capture } from "./services/telemetry/index.js"
import packageJson from "../package.json" with { type: "json" }
import { statusBar } from "./utilities/settings/statusBar.js"
import fg from "fast-glob"
import { saveProjectToDirectory, type IdeExtensionConfig } from "@inlang/sdk"
import path from "node:path"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { setupDirectMessageWatcher } from "./utilities/fs/experimental/directMessageHandler.js"
import { logger } from "./utilities/logger.js"
//import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"

// Entry Point
export async function activate(
	context: vscode.ExtensionContext
): Promise<{ context: vscode.ExtensionContext } | undefined> {
	// Sentry Error Handling
	//initErrorMonitoring()

	try {
		logger.info("Activating Sherlock extension")
		vscode.commands.executeCommand("setContext", "sherlock:hasProjectInWorkspace", false)
		vscode.commands.executeCommand("setContext", "sherlock:showRecommendationBanner", false)
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

		if (!workspaceFolder) {
			logger.warn("No workspace folder found during activation")
			return
		}

		logger.debug("Workspace folder detected", {
			workspace: workspaceFolder.uri.fsPath,
		})

		const mappedFs = createFileSystemMapper(path.normalize(workspaceFolder.uri.fsPath), fs)

		await setProjects({ workspaceFolder })
		await main({ context, workspaceFolder, fs: mappedFs })

		logger.info("Sherlock extension activated")
		capture({
			event: "IDE-EXTENSION activated",
			properties: {
				vscode_version: vscode.version,
				version: packageJson.version,
				platform: process.platform,
			},
		})

		return { context }
	} catch (error) {
		logger.error("Activation failed", error)
		handleError(error)
		return
	}
}

// Main Function
export async function main(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: FileSystem
}): Promise<void> {
	logger.info("Starting Sherlock main flow", {
		workspace: args.workspaceFolder.uri.fsPath,
	})

	const currentState = safeState()

	if (!currentState) {
		logger.warn("State unavailable when main() executed; showing getting started view")
		await gettingStartedView(args)
		return
	}

	const projectsInWorkspace = currentState.projectsInWorkspace || []

	logger.debug("Projects discovered", {
		count: projectsInWorkspace.length,
	})

	if (projectsInWorkspace.length > 0) {
		// find the closest project to the workspace
		const closestProjectToWorkspace = await closestInlangProject({
			workingDirectory: path.normalize(args.workspaceFolder.uri.fsPath),
			projects: projectsInWorkspace,
		})

		const selectedProjectPath =
			closestProjectToWorkspace?.projectPath || projectsInWorkspace[0]?.projectPath || ""

		logger.info("Selecting project", {
			selectedProjectPath,
			closestMatchFound: Boolean(closestProjectToWorkspace),
			availableProjects: projectsInWorkspace.map((project) => project.projectPath),
		})

		setState({
			...state(),
			selectedProjectPath,
		})

		vscode.commands.executeCommand("setContext", "sherlock:hasProjectInWorkspace", true)
		logger.debug("VS Code context updated for project availability")

		// Recommendation Banner
		await recommendationBannerView(args)
		// Project Listings
		await projectView(args)
		// Messages
		await messageView(args)
		// Errors
		await errorView(args)
		// Status Bar
		await statusBar(args)

		// Register Extension Components & Handle Inlang Errors
		await registerExtensionComponents(args)
		await handleInlangErrors()

		// Set up both file system watchers
		// setupFileSystemWatcher(args)

		// Set up direct message watcher as a fallback
		logger.debug("Initializing direct message watcher")
		setupDirectMessageWatcher({
			context: args.context,
			workspaceFolder: args.workspaceFolder,
		})

		logger.info("Sherlock main flow initialized")

		return
	} else {
		logger.info("No projects in workspace; showing getting started view")
		await gettingStartedView(args)
	}
}

async function registerExtensionComponents(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: FileSystem
}) {
	const currentState = safeState()
	if (!currentState?.project) {
		logger.warn("registerExtensionComponents invoked before project loaded")
		return
	}

	args.context.subscriptions.push(
		...Object.values(CONFIGURATION.COMMANDS).map((c) => c.register(c.command, c.callback as any))
	)

	const ideExtension = (await currentState.project.plugins.get()).find(
		(plugin) => plugin?.meta?.["app.inlang.ideExtension"]
	)?.meta?.["app.inlang.ideExtension"] as IdeExtensionConfig | undefined

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: `!${CONFIGURATION.FILES.PROJECT}` },
		...(ideExtension?.documentSelectors ?? []),
	]

	args.context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		})
	)

	messagePreview(args)
	// TODO: Replace by lix validation rules
	linterDiagnostics(args)
	logger.debug("Extension components registered")
}

async function handleInlangErrors() {
	const currentState = safeState()
	if (!currentState?.project) {
		logger.warn("handleInlangErrors invoked without a loaded project")
		return
	}

	const inlangErrors = (await currentState.project.errors.get()) || []
	if (inlangErrors.length > 0) {
		logger.error("Extension errors (Sherlock)", inlangErrors)
	}
}

async function setProjects(args: { workspaceFolder: vscode.WorkspaceFolder }) {
	try {
		const workspacePath = fg.convertPathToPattern(args.workspaceFolder.uri.fsPath) // Normalize path
		const projectsList = (
			await fg.async(`${workspacePath}/**/*.inlang`, {
				onlyDirectories: true,
				ignore: ["**/node_modules/**"],
				absolute: true, // Ensures paths are absolute and properly formatted
				cwd: workspacePath, // Makes it platform-agnostic
			})
		).map((project) => ({
			projectPath: project,
		}))

		logger.info("Discovered inlang projects", {
			workspace: args.workspaceFolder.uri.fsPath,
			count: projectsList.length,
		})

		setState({
			...state(),
			projectsInWorkspace: projectsList,
		})
	} catch (error) {
		logger.error("Failed to enumerate projects", error)
		handleError(error)
	}
}

export async function saveProject() {
	try {
		const currentState = safeState()
		if (currentState?.selectedProjectPath && currentState?.project) {
			await saveProjectToDirectory({
				fs: createFileSystemMapper(currentState.selectedProjectPath, fs),
				project: currentState.project,
				path: currentState.selectedProjectPath,
			})
		} else {
			logger.warn("saveProject invoked without an active project")
		}
	} catch (error) {
		logger.error("Failed to save project", error)
		handleError(error)
	}
}
