/**
 * Handles mapping specific key presses to logical Lexical commands.
 */

import type { LexicalEditor } from "lexical";
import { mergeRegister, $getNearestNodeOfType } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR, // Use editor priority for keybindings to override defaults
  COMMAND_PRIORITY_HIGH,   // Higher priority
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { TextBlockNode, $isTextBlockNode } from "./nodes/TextBlockNode.js"; // Import custom node

export function registerKeybindings(editor: LexicalEditor): () => void {
  const unregister = mergeRegister(
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
        // Consider keys like Cmd+I for italic
        if (
          (event.metaKey && event.key === "i") // Cmd+I for Italic
        ) {
          event.preventDefault();
          console.log("[Keybindings] Cmd+I detected. Selection:", $getSelection());

          // Get the selection
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Log more details about selection
          console.log("[Keybindings] Selection details:", {
            anchor: {
              key: selection.anchor.key,
              offset: selection.anchor.offset,
            },
            focus: {
              key: selection.focus.key,
              offset: selection.focus.offset,
            },
            isBackward: selection.isBackward(),
            isCollapsed: selection.isCollapsed(),
          });

          console.log("[Keybindings] Dispatched FORMAT_TEXT_COMMAND for italic.");
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          return true; // Handled
        }
        return false; // Let other keydown handlers run (e.g., for arrow keys, etc.)
      },
      COMMAND_PRIORITY_EDITOR, // Use high priority to intercept simple keys
    ),

    // Handle Enter Key MANUALLY by finding parent TextBlockNode
    editor.registerCommand<KeyboardEvent>(
      KEY_ENTER_COMMAND,
      (event) => {
        // Modifications must be done in an update block
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            // Should not happen for Enter, but good practice
            return; 
          }
          // Prevent default browser behavior (like adding a div)
          event.preventDefault(); 

          const anchorNode = selection.anchor.getNode();
          // Find the containing TextBlockNode
          const textBlock = $getNearestNodeOfType(anchorNode, TextBlockNode);

          if ($isTextBlockNode(textBlock)) {
            // Directly call the method on the node instance
            const newBlock = textBlock.insertNewAfter();
            // Select the start of the new block itself
            newBlock.selectStart();
            return true; // Mark the command as handled
          } else {
            // This case might happen if the selection is not inside a TextBlock
            // (e.g., selecting across multiple blocks or at root)
            // Or if the active node isn't a TextBlockNode.
            // Allow default behavior (might insert default paragraph or break)
            return false; // Let other handlers manage it
          }
        });
        return false; // Not a range selection, let others handle
      },
      COMMAND_PRIORITY_HIGH, // Use HIGH priority to preempt default handlers
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
  );

  return unregister;
}
