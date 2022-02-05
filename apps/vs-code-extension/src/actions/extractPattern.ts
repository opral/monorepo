import * as vscode from 'vscode';

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class ExtractPattern implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  public provideCodeActions(document: vscode.TextDocument): vscode.CodeAction[] | undefined {
    const selection = vscode.window.activeTextEditor?.selection;
    // user has not highlighted text
    if (selection === undefined || selection.isEmpty) {
      return;
    }
    const fix = new vscode.CodeAction(`Inlang: Extract pattern`, vscode.CodeActionKind.QuickFix);
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(
      document.uri,
      new vscode.Range(selection.start, selection.end),
      't("some key")'
    );
    return [fix];
  }
}
