import * as vscode from 'vscode';
import { state } from '../state';
import { invalidIdReason, isValidId } from '@inlang/fluent-syntax';

export type ExtractPatternCommandArgs = {
  pattern: string;
  activeTextEditor: vscode.TextEditor;
};

export const extractPatternCommand = {
  id: 'inlang.extractPattern',
  title: 'Extract pattern',
  callback: async function (args: ExtractPatternCommandArgs) {
    if (state.config.extractPatternReplacementOptions === undefined) {
      return vscode.window.showErrorMessage(
        'The extractPatternReplacementOptions are not defined in the inlang.config.json.'
      );
    }
    const id = await vscode.window.showInputBox({
      title: 'Enter the ID:',
      validateInput: (input) => {
        if (isValidId(input)) {
          return;
        }
        const reason = invalidIdReason(input);
        // attribute id has not been entered yet (which is no error but leads to an invalid id)
        if (reason !== 'Expected attribute id.') {
          return reason;
        }
      },
    });
    if (id === undefined) {
      return;
    }
    const replacementPattern = await vscode.window.showQuickPick(
      state.config.extractPatternReplacementOptions.map((option) => option.replace(/{id}/, id)),
      { title: 'Select a pattern replacement option:' }
    );
    if (replacementPattern === undefined) {
      return;
    }
    await args.activeTextEditor.edit((editor) => {
      editor.replace(args.activeTextEditor.selection, replacementPattern);
    });
  },
} as const;
