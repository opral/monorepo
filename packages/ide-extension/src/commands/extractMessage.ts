import * as vscode from "vscode";
import { state } from "../state.js";
import { query } from "@inlang/core/query"
import type { Message } from '@inlang/core/ast';

/**
 *
 */
export const extractMessageCommand = {
  id: "inlang.extractMessage",
  title: "Inlang: Extract Message",
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

    const messageId = await vscode.window.showInputBox({ title: "Enter the ID:" });
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
      return vscode.window.showWarningMessage("Couldn't find choosen extract option.");
    }

    const messageValue = textEditor.document.getText(textEditor.selection);
    const message: Message = {
      type: 'Message',
      id: { type: 'Identifier', name: messageId },
      pattern: { type: 'Pattern', elements: [{ type: 'Text', value: messageValue }] }
    };
    // find reference langauge resource
    const referenceResource = state().resources.find((resource) => resource.languageTag.name === referenceLanguage);
    if (referenceResource) {
      const newResource = query(referenceResource).upsert({ message });
      if (newResource.isOk) {
        const resources = state().resources.map((resource) => (resource.languageTag.name === referenceLanguage ? newResource.unwrap() : resource));
        await writeResources({
          config: state().config,
          resources
        });
        state().resources = resources;
      } else {
        return vscode.window.showErrorMessage("Couldn't upsert new message.");
      }
    }
    await textEditor.edit((editor) => {
      editor.replace(textEditor.selection, extractMessageOption.callback(messageId, messageValue));
    });
    return vscode.window.showInformationMessage("Message extracted.");
  },
} as const;
