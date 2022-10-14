import * as vscode from "vscode";
import { state } from "../state.js";
import {
	extractPatternCommand,
	ExtractPatternCommandArgs,
} from "../commands/extractPattern.js";

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class ExtractPattern implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix,
	];

	public async provideCodeActions(
		document: vscode.TextDocument
	): Promise<vscode.CodeAction[]> {
		const activeTextEditor = vscode.window.activeTextEditor;
		// user has not highlighted text
		if (activeTextEditor === undefined || activeTextEditor.selection.isEmpty) {
			return [];
		} else if (
			state.config.extractPattern.replacementOptions("") === undefined
		) {
			return [];
		}
		const extractPatternAction = new vscode.CodeAction(
			`Inlang: Extract pattern`
		);
		// workaround to get typesafety when passing down the arguments
		const args: ExtractPatternCommandArgs = {
			pattern: document.getText(activeTextEditor.selection),
			activeTextEditor,
		};
		extractPatternAction.command = {
			title: extractPatternCommand.title,
			command: extractPatternCommand.id,
			arguments: [args],
		};
		return [extractPatternAction];
	}

	public resolveCodeAction(
		codeAction: vscode.CodeAction
	): vscode.ProviderResult<vscode.CodeAction> {
		console.log(codeAction);
		return;
	}
}
