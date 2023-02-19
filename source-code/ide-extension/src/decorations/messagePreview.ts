import * as vscode from "vscode";
import { debounce } from "throttle-debounce";
import { query } from '@inlang/core/query';
import { state } from "../state.js";

export async function messagePreview(args: { activeTextEditor: vscode.TextEditor, context: vscode.ExtensionContext }) {
  const { context } = args;
  const { referenceLanguage } = state().config;
  const referenceResource = state().resources.find((resource) => resource.languageTag.name === referenceLanguage);
  let activeTextEditor = vscode.window.activeTextEditor;

  const messagePreview = vscode.window.createTextEditorDecorationType({});

  if (state().config.referenceLanguage === undefined) {
    return vscode.window.showWarningMessage(
      "The `referenceLanguage` musst be defined in the inlang.config.js to show patterns inline."
    );
  }

  updateDecorations();

  async function updateDecorations() {
    if (!activeTextEditor || !referenceResource) {
      return;
    }

    const wrappedDecorations = state().config.ideExtension?.messageFinders.map(async (finder) => {
      const messages = await finder({ documentText: args.activeTextEditor.document.getText() });
      return messages.map((message) => {
        const translation = query(referenceResource).get({ id: message.messageId })?.pattern.elements;
        const translationText = translation && translation.length > 0 ? translation[0].value : undefined;
        const range = new vscode.Range(
          // VSCode starts to count lines and columns from zero
          new vscode.Position(message.position.start.line - 1, message.position.start.character - 1),
          new vscode.Position(message.position.end.line - 1, message.position.end.character - 1)
        );
        const decoration: vscode.DecorationOptions = {
          range,
          renderOptions: {
            after: {
              contentText: translationText ?? `ERROR: '${message.messageId}' not found`,
              margin: '0 0.5rem',
              backgroundColor: translationText ? 'rgb(45 212 191/.15)' : 'rgb(244 63 94/.15)',
              border: translationText ? '1px solid rgb(45 212 191/.50)' : '1px solid rgb(244 63 94/.50)',
            },
          }
        };
        return decoration;
      });
    });
    const decorations = (await Promise.all(wrappedDecorations || [])).flat();
    activeTextEditor.setDecorations(messagePreview, decorations);
  }

  const debouncedUpdateDecorations = debounce(500, updateDecorations);

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      activeTextEditor = editor;
      debouncedUpdateDecorations();
    }
  }, undefined, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeTextEditor && event.document === activeTextEditor.document) {
      updateDecorations();
    }
  }, undefined, context.subscriptions);
}
