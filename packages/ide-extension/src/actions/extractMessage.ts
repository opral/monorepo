import * as vscode from "vscode";
import { state } from "../state.js";
import {
  extractMessageCommand,
  ExtractMessageCommandArgs,
} from "../commands/extractMessage.js";

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class ExtractMessage implements vscode.CodeActionProvider {
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
    }
    const extractMessageAction = new vscode.CodeAction(
      `Inlang: Extract Message`
    );
    // workaround to get typesafety when passing down the arguments
    const args: ExtractMessageCommandArgs = {
      pattern: document.getText(activeTextEditor.selection),
      activeTextEditor,
    };
    extractMessageAction.command = {
      title: extractMessageCommand.title,
      command: extractMessageCommand.id,
      arguments: [args],
    };
    return [extractMessageAction];
  }

  public resolveCodeAction(
    codeAction: vscode.CodeAction
  ): vscode.ProviderResult<vscode.CodeAction> {
    console.log(codeAction);
    return;
  }
}
