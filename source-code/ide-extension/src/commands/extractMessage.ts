import * as vscode from "vscode";
import { state } from "../state.js";

export type ExtractMessageCommandArgs = {
  pattern: string;
  activeTextEditor: vscode.TextEditor;
};

export const extractMessageCommand = {
  id: "inlang.extractMessage",
  title: "Extract Message",
  callback: async function (args: ExtractMessageCommandArgs) {
    const { ideExtension, referenceLanguage } = state().config;

    // guards
    if (!ideExtension) {
      return vscode.window.showWarningMessage(
        "There is no `ideExtension` object in the inlang.config.json configured."
      );
    }
    if (ideExtension.extractMessageOptions === undefined) {
      return vscode.window.showWarningMessage(
        "The `extractMessageReplacementOptions` are not defined in the inlang.config.json but required to extract a message."
      );
    } else if (referenceLanguage === undefined) {
      return vscode.window.showWarningMessage(
        "The `referenceLanguage` is not defined in the inlang.config.js but required to extract a message."
      );
    }

    const id = await vscode.window.showInputBox({
      title: "Enter the ID:",
    });
    if (id === undefined) {
      return;
    }

    const extractMessageOptionId = await vscode.window.showQuickPick(
      [
        ...ideExtension.extractMessageOptions.map(o => o.id),
        "How to edit these replacement options?",
      ],
      { title: "Replace highlighted text with:" }
    );
    if (extractMessageOptionId === undefined) {
      return;
    } else if (
      extractMessageOptionId === "How to edit these replacement options?"
    ) {
      // TODO #152
      return vscode.env.openExternal(
        vscode.Uri.parse("https://github.com/inlang/inlang")
      );
    }

    const extractMessageOption = ideExtension.extractMessageOptions.find(o => o.id === extractMessageOptionId);

    if (extractMessageOption === undefined) {
      return vscode.window.showWarningMessage(
        "Couldn't find choosen extract option."
      );
    }
    await args.activeTextEditor.edit((editor) => {
      editor.replace(args.activeTextEditor.selection, 'Test');
    });
    return vscode.window.showInformationMessage("Pattern extracted.");
  },
} as const;
