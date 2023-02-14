import * as vscode from "vscode";
import { state } from "../state.js";
import { query } from "@inlang/core/query"
import type { Message } from '@inlang/core/ast';

export const extractMessageCommand = {
  id: "inlang.extractMessage",
  title: "Extract Message",
  callback: async function (textEditor: vscode.TextEditor) {
    const { ideExtension, referenceLanguage, readResources, writeResources } = state().config;

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

    const messageId = await vscode.window.showInputBox({
      title: "Enter the ID:",
    });
    if (messageId === undefined) {
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

    const messageValue = textEditor.document.getText(textEditor.selection);
    const message: Message = {
      type: 'Message',
      id: { type: 'Identifier', name: messageId },
      pattern: { type: 'Pattern', elements: [{ type: 'Text', value: messageValue }] }
    };
    const resources = await readResources({ config: state().config });
    const referenceResource = resources.find((resource) => resource.languageTag.name === referenceLanguage);
    if (referenceResource) {
      await writeResources({
        config: state().config,
        resources: resources.map((resource) =>
          resource.languageTag.name === referenceLanguage
            ? query(referenceResource).upsert({ message }).unwrap()
            : resource
        )
      });
    }
    await textEditor.edit((editor) => {
      editor.replace(textEditor.selection, extractMessageOption.callback(messageId, messageValue));
    });
    return vscode.window.showInformationMessage("Message extracted.");
  },
} as const;
