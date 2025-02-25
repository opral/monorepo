import * as vscode from "vscode"
import { capture } from "../services/telemetry/index.js"
import { CONFIGURATION } from "../configuration.js"

/**
 * Show light bulb quick fixes when text is selected, offering message extraction.
 */
export class ExtractMessage implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix]

	public async provideCodeActions(
		_document: vscode.TextDocument,
		range: vscode.Range
	): Promise<vscode.CodeAction[] | undefined> {
		// return if no text is selected
		if (range.isEmpty) {
			return
		}
		const extractMessageAction = new vscode.CodeAction(`Sherlock: Extract Message`)
		extractMessageAction.command = CONFIGURATION.COMMANDS.EXTRACT_MESSAGE
		return [extractMessageAction]
	}

	public async resolveCodeAction(): Promise<vscode.CodeAction> {
		capture({
			event: "IDE-EXTENSION code action resolved",
			properties: { name: "extract message" },
		})

		// Replace the following line with your code logic
		const codeAction: vscode.CodeAction = new vscode.CodeAction(
			"Code action resolved",
			vscode.CodeActionKind.Refactor
		)

		return codeAction
	}
}
