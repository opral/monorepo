/**
 * Handles mapping specific key presses to logical Lexical commands.
 */

import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
} from "lexical";

export function registerKeybindings(editor: LexicalEditor): () => void {
  const unregister = mergeRegister(
    // Handle standard formatting commands (Cmd/Ctrl + B/I)
    editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        const { metaKey, ctrlKey, key } = event;
        const isShortcut = metaKey || ctrlKey;

        if (isShortcut && key.toLowerCase() === "b") {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          return true;
        }
        if (isShortcut && key.toLowerCase() === "i") {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          return true;
        }
        // Let other handlers or default behavior process the event
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),

    // Handle basic character input directly
    editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        const { key, metaKey, ctrlKey, altKey } = event;
        // Intercept single character keys without modifiers
        if (key.length === 1 && !metaKey && !ctrlKey && !altKey) {
          event.preventDefault();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertText(key);
            }
          });
          return true; // Handled
        }
        return false; // Not handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // TODO: Add handlers for other keys if needed (e.g., Tab, Arrows with Shift)
  );

  return unregister;
}
