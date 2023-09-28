import * as vscode from "vscode"
import { state } from "./state.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { messagePreview } from "./decorations/messagePreview.js"
import { ExtractMessage } from "./actions/extractMessage.js"
import { msg } from "./utilities/message.js"
import { getGitOrigin } from "./services/telemetry/index.js"
import { propertiesMissingPreview } from "./decorations/propertiesMissingPreview.js"
import { recommendation } from "./utilities/recommendation.js"
import { linterDiagnostics } from "./diagnostics/linterDiagnostics.js"
import { openInEditorCommand } from "./commands/openInEditor.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { SETTINGS_FILE_NAME, getActiveTextEditor, initProject } from "./utilities/initProject.js"
import { handleError, telemetryCapture } from "./utilities/utils.js"

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
	if (!project && (await vscode.workspace.findFiles(SETTINGS_FILE_NAME)).length !== 0) {
		main(args)
		return
	}

	if (error) {
		handleError(error)
		return
	}

	// Register commands and other extension functionality
	args.context.subscriptions.push(
		vscode.commands.registerCommand(editMessageCommand.id, editMessageCommand.callback),
		vscode.commands.registerTextEditorCommand(
			extractMessageCommand.id,
			extractMessageCommand.callback
		),
		vscode.commands.registerCommand(openInEditorCommand.id, openInEditorCommand.callback)
	)

	const documentSelectors: vscode.DocumentSelector = [
		{ language: "javascript", pattern: `!${SETTINGS_FILE_NAME}` },
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
