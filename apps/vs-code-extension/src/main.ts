import * as vscode from 'vscode';
import { Emojizer } from './actions/extractPattern';

export function activate(context: vscode.ExtensionContext): void {
  const supportedLanguages = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'svelte',
  ];

  for (const language of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(language, new Emojizer(), {
        providedCodeActionKinds: Emojizer.providedCodeActionKinds,
      })
    );
  }
}

// this method is called when your extension is deactivated
// export function deactivate() {}
