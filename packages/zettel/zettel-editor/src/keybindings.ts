/**
 * Handles mapping specific key presses to logical Lexical commands.
 */

import type { LexicalEditor } from "lexical";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";

export function registerKeybindings(editor: LexicalEditor): () => void {
  const unregister = mergeRegister(
    // Handler for Cmd+B/I (Low Priority)
    editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        const { key, metaKey, ctrlKey, altKey } = event;

        // Handle standard formatting commands (Cmd/Ctrl + B/I)
        if ((metaKey || ctrlKey) && !altKey) {
          if (key.toLowerCase() === "b") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            return true;
          }
          if (key.toLowerCase() === "i") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            return true;
          }
        }

        // Handle printable character input directly (restored)
        if (key.length === 1 && !metaKey && !ctrlKey && !altKey) {
          event.preventDefault(); // Prevent native handling since we're doing it
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertText(key);
            }
          });
          return true; // Indicate we handled this event
        }

        // Let other key down events fall through (including printable chars for now)
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),

    // Handler for Enter Key (Editor Priority)
    editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        if (event !== null) {
          event.preventDefault();
        }
        // Dispatch INSERT_LINE_BREAK_COMMAND which should be handled in commands.ts
        return editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false);
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );

  return unregister;
}
