import * as vscode from "vscode"
import { extractMessageCommand } from "../commands/extractMessage.js"

/**
 * Show light bulb quick fixes when text is selected, offering message extraction.
 */
export class ExtractMessage implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix]

	public async provideCodeActions(
		_document: vscode.TextDocument,
		range: vscode.Range,
	): Promise<vscode.CodeAction[] | undefined> {
		// return if no text is selected
		if (range.isEmpty) {
			return
		}
		const extractMessageAction = new vscode.CodeAction(`Inlang: Extract Message`)
		extractMessageAction.command = {
			title: extractMessageCommand.title,
			command: extractMessageCommand.id,
		}
		return [extractMessageAction]
	}

	public resolveCodeAction(
		codeAction: vscode.CodeAction,
	): vscode.ProviderResult<vscode.CodeAction> {
		console.log(codeAction)
		return
	}
}
