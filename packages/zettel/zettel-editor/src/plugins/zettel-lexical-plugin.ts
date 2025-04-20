// src/plugins/ZettelCorePlugin.ts
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  TextFormatType,
  SerializedEditorState,
} from "lexical";
import { mergeRegister } from "@lexical/utils";

import { registerEditorCommands } from "./commands.js";
import { exportZettelAST } from "./conversion.js";
import { Zettel } from "@opral/zettel-ast";

/**
 * Registers the core functionality for the Zettel editor,
 * including keybindings, command handling, and Zettel AST conversion.
 * @param editor The Lexical editor instance.
 * @param onZettelUpdate Callback function triggered with the updated Zettel AST and Lexical editor state.
 * @returns A cleanup function to unregister listeners.
 */
export function registerZettelLexicalPlugin(
  editor: LexicalEditor,
  onZettelUpdate: (
    zettelAst: Zettel,
    lexicalState: SerializedEditorState,
  ) => void,
): () => void {
  // Register standard keybindings and command handlers
  const unregisterFormatText = editor.registerCommand<TextFormatType>(
    FORMAT_TEXT_COMMAND,
    (payload) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.formatText(payload);
        }
      });
      return true; // Indicate command was handled
    },
    COMMAND_PRIORITY_EDITOR, // Use standard editor priority
  );

  // Register command handlers (e.g., for line breaks)
  const unregisterCommandHandlers = registerEditorCommands(editor);

  // Register listener to convert editor state to Zettel AST on update
  const unregisterUpdateListener = editor.registerUpdateListener(
    ({ editorState }) => {
      // Convert to Zettel AST
      const zettelAST = exportZettelAST(editorState, editor);
      const lexicalState = editorState.toJSON();
      // Call the provided callback with the new AST and Lexical state
      onZettelUpdate(zettelAST, lexicalState);
    },
  );

  // Return a function that unregisters all listeners
  return mergeRegister(
    unregisterCommandHandlers,
    unregisterUpdateListener,
    unregisterFormatText, // Add the new unregister function
  );
}
