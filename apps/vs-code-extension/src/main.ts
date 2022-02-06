import * as vscode from 'vscode';
import { ExtractPattern } from './actions/extractPattern';
import { initState } from './state';
import { extractPatternCommand } from './commands/extractPattern';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    const supportedLanguages = [
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
      'svelte',
    ];

    // if no active text editor -> no window is open -> hence dont activate the extension
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      return;
    }
    // activeTextEditor is defined -> try to intialize the state
    const initStateResult = await initState({ activeTextEditor });
    if (initStateResult.isErr) {
      vscode.window.showErrorMessage(initStateResult.error.message);
    }
    // register the commands and code actions
    for (const language of supportedLanguages) {
      context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(language, new ExtractPattern(), {
          providedCodeActionKinds: ExtractPattern.providedCodeActionKinds,
        })
      );
    }
    context.subscriptions.push(
      vscode.commands.registerCommand(extractPatternCommand.id, extractPatternCommand.callback)
    );
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
    console.error(error);
  }
}

// this method is called when your extension is deactivated
// export function deactivate() {}
