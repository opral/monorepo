// src/plugins/ZettelCorePlugin.ts
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  TextFormatType,
} from "lexical";
import { mergeRegister } from "@lexical/utils";

import { registerKeybindings } from "./keybindings.js";
import { registerCommandHandlers } from "./commands.js";
import { exportZettelAST, ZettelBlock } from "./conversion.js";

/**
 * Registers the core functionality for the Zettel editor,
 * including keybindings, command handling, and Zettel AST conversion.
 * @param editor The Lexical editor instance.
 * @param onZettelUpdate Callback function triggered with the updated Zettel AST.
 * @returns A cleanup function to unregister listeners.
 */
export function registerZettelLexicalPlugin(
  editor: LexicalEditor,
  onZettelUpdate: (ast: ZettelBlock[]) => void,
): () => void {
  // Register standard keybindings and command handlers
  const unregisterKeybindings = registerKeybindings(editor);
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
  const unregisterCommandHandlers = registerCommandHandlers(editor);

  // Register listener to convert editor state to Zettel AST on update
  const unregisterUpdateListener = editor.registerUpdateListener(
    ({ editorState }) => {
      // Convert to Zettel AST
      const zettelAST = exportZettelAST(editorState);
      // Call the provided callback with the new AST
      onZettelUpdate(zettelAST);

      // Note: Dispatching the raw lexical state update event might also be done here
      // if needed externally, but for now, we focus on the Zettel AST.
      // editor.getRootElement()?.dispatchEvent(
      //   new CustomEvent("lexical-state-updated", {
      //     detail: editorState.toJSON(),
      //     bubbles: true,
      //     composed: true,
      //   })
      // );
    },
  );

  // Return a function that unregisters all listeners
  return mergeRegister(
    unregisterKeybindings,
    unregisterCommandHandlers,
    unregisterUpdateListener,
    unregisterFormatText, // Add the new unregister function
  );
}
