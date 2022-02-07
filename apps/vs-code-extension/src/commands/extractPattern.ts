import * as vscode from 'vscode';
import { state } from '../state';
import { invalidIdReason, isValidId } from '@inlang/fluent-syntax';
import { LanguageCode, Result } from '@inlang/common';
import { writeTranslationFiles } from '../utils/writeTranslationFiles';

export type ExtractPatternCommandArgs = {
  pattern: string;
  activeTextEditor: vscode.TextEditor;
};

export const extractPatternCommand = {
  id: 'inlang.extractPattern',
  title: 'Extract pattern',
  callback: async function (args: ExtractPatternCommandArgs) {
    if (state.config.extractPatternReplacementOptions === undefined) {
      return vscode.window.showWarningMessage(
        'The `extractPatternReplacementOptions` are not defined in the inlang.config.json but required to extract a pattern.'
      );
    }
    if (state.config.baseLanguageCode === undefined) {
      return vscode.window.showWarningMessage(
        'The `baseLanguageCode` is not defined in the inlang.config.json but required to extract a pattern.'
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
    } else if (isValidId(id) === false) {
      return vscode.window.showErrorMessage(invalidIdReason(id));
    }
    const replacementPattern = await vscode.window.showQuickPick(
      state.config.extractPatternReplacementOptions.map((option) => option.replace(/{id}/, id)),
      { title: 'Select a pattern replacement option:' }
    );
    if (replacementPattern === undefined) {
      return;
    }
    let create: Result<void, Error>;
    if (id.includes('.')) {
      create = state.resources.createAttribute({
        messageId: id.split('.')[0],
        id: id.split('.')[1],
        pattern: args.pattern,
        languageCode: 'en',
      });
    } else {
      create = state.resources.createMessage({
        id,
        pattern: args.pattern,
        languageCode: state.config.baseLanguageCode as LanguageCode,
      });
    }
    if (create.isErr) {
      return vscode.window.showErrorMessage(create.error.message);
    }
    const write = writeTranslationFiles({
      cwd: state.configPath,
      resources: state.resources,
      ...state.config,
    });
    if (write.isErr) {
      return vscode.window.showErrorMessage(write.error.message);
    }
    // replacing the pattern once all possible errors are ruled out.
    await args.activeTextEditor.edit((editor) => {
      editor.replace(args.activeTextEditor.selection, replacementPattern);
    });
    return vscode.window.showInformationMessage('Translation created');
  },
} as const;
