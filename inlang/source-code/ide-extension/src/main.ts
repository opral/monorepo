import * as vscode from "vscode"
import { state } from "./state.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { ExtractMessage } from "./actions/extractMessage.js"
import { msg } from "./utilities/message.js"
import { getGitOrigin } from "./services/telemetry/index.js"
import { propertiesMissingPreview } from "./decorations/propertiesMissingPreview.js"
import { recommendation } from "./utilities/recommendation.js"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { getActiveTextEditor, initProject } from "./utilities/initProject.js"
import { handleError, telemetryCapture } from "./utilities/utils.js"
import { CONFIGURATION } from "./configuration.js"

// Entry Point
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const gitOrigin = await getGitOrigin()
		telemetryCapture("IDE-EXTENSION activated")

		// Start the IDE extension
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
	const activeTextEditor = getActiveTextEditor()

	if (!activeTextEditor) {
		return
	}

	const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri)

	if (!workspaceFolder) {
		console.warn("No workspace folder found.")
		return
	}

	// initate project
	const { project, error } = await initProject({ workspaceFolder, gitOrigin: args.gitOrigin })

	// if project is undefined but the files exists, the project got migrated / newly created and we need to restart the extension
	if (!project && (await vscode.workspace.findFiles(CONFIGURATION.FILES.PROJECT)).length !== 0) {
		main(args)
		return
	}

	if (error) {
		handleError(error)
		return
	}

	// Watch for changes in the config file
	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, CONFIGURATION.FILES.PROJECT)
	)
	// Listen for changes in the config file
	watcher.onDidChange(() => {
		main(args)
	})

	// Register commands and other extension functionality
	args.context.subscriptions.push(
		...Object.values(CONFIGURATION.COMMANDS).map((c) => c.register(c.command, c.callback as any))
	)

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: `!${CONFIGURATION.FILES.PROJECT}` },
		...(state().project.customApi()["app.inlang.ideExtension"]?.documentSelectors || []),
	]

	// Register source actions
	args.context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(documentSelectors, new ExtractMessage(), {
			providedCodeActionKinds: ExtractMessage.providedCodeActionKinds,
		})
	)

	// Register decorations
	messagePreview(args)

	// Properties missing decoration in project.inlang.json
	propertiesMissingPreview()

	// Add inlang extension to recommended extensions
	recommendation({ workspaceFolder })

	// Linter diagnostics
	linterDiagnostics(args)

	// Log inlang errors
	const inlangErrors = state().project.errors()
	if (inlangErrors.length > 0) {
		console.error("Inlang VSCode Extension errors:", inlangErrors)
	}
}

// Deactivate function (if needed)
// export function deactivate() {}
