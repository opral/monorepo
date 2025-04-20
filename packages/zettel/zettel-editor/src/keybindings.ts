/**
 * Handles mapping specific key presses to logical Lexical commands.
 */

import type { LexicalEditor } from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR, // Use editor priority for keybindings to override defaults
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical";

export function registerKeybindings(editor: LexicalEditor): () => void {
  return mergeRegister(
    // Handle basic text insertion for single characters
    editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          // Dispatch the command to be handled by our handler in commands.ts
          editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, event.key);
          // Prevent the browser's default handling for this key press
          event.preventDefault();
          return true; // We initiated the handling
        }
        return false; // Let other keydown handlers run (e.g., for arrow keys, etc.)
      },
      COMMAND_PRIORITY_EDITOR, // Use high priority to intercept simple keys
    ),

    // Handle Backspace
    editor.registerCommand<KeyboardEvent>(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        event.preventDefault();
        // Dispatch the logical delete command
        if (event.altKey) {
          // Alt/Option + Backspace: Delete word backward
          editor.dispatchCommand(DELETE_WORD_COMMAND, true);
        } else {
          // Just Backspace: Delete character backward
          editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
        }
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Handle Delete
    editor.registerCommand<KeyboardEvent>(
      KEY_DELETE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        event.preventDefault();
        // Dispatch the logical delete command
        editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Handle Enter Key
    editor.registerCommand<KeyboardEvent>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        event.preventDefault();
        // Always insert line break on Enter
        editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );
}
