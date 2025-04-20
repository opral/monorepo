/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Adapted for Zettel Editor - Minimal command handlers
 */

import type { CommandPayloadType, LexicalEditor } from "lexical";

import {
  $getHtmlContent,
  $insertDataTransferForPlainText,
} from "@lexical/clipboard";
import { mergeRegister, objectKlassEquals } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $selectAll,
  $createRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COPY_COMMAND,
  CUT_COMMAND, // Needed for cut helper
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND, // Import command
  PASTE_COMMAND,
  SELECT_ALL_COMMAND,
} from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { TextBlockNode } from "./nodes/TextBlockNode.js"; // Import node type
import { ZettelSpanNode } from "./nodes/ZettelSpanNode.js"; // Import node type
import { generateKey } from "@opral/zettel-ast"; // Import key generation

// --- Helper Functions (Adapted from @lexical/plain-text) --- //

function onCopyForPlainText(
  event: CommandPayloadType<typeof COPY_COMMAND>,
  editor: LexicalEditor,
): void {
  editor.update(() => {
    if (event !== null) {
      const clipboardData = objectKlassEquals(event, KeyboardEvent)
        ? null
        : event.clipboardData;
      const selection = $getSelection();

      if (selection !== null && clipboardData != null) {
        event.preventDefault();
        const htmlString = $getHtmlContent(editor);

        if (htmlString !== null) {
          clipboardData.setData("text/html", htmlString);
        }

        clipboardData.setData("text/plain", selection.getTextContent());
      }
    }
  });
}

function onPasteForPlainText(
  event: CommandPayloadType<typeof PASTE_COMMAND>,
  editor: LexicalEditor,
): void {
  event.preventDefault();
  editor.update(
    () => {
      const selection = $getSelection();
      const clipboardData = objectKlassEquals(event, ClipboardEvent)
        ? event.clipboardData
        : null;
      if (clipboardData != null && $isRangeSelection(selection)) {
        $insertDataTransferForPlainText(clipboardData, selection);
      }
    },
    {
      tag: "paste", // Use string literal tag for paste operations
    },
  );
}

// --- Command Registration --- //

export function registerCommandHandlers(editor: LexicalEditor): () => void {
  return mergeRegister(
    // Text Insertion (Directly handles simple text insertion)
    editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (payload: string | InputEvent) => {
        // Only handle string payloads (from our keydown dispatch)
        if (typeof payload === "string") {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Special case: Inserting text into an empty TextBlockNode
            if (selection.isCollapsed()) {
              const anchorNode = selection.anchor.getNode();
              const parentBlock = $getNearestNodeOfType(
                anchorNode,
                TextBlockNode,
              );
              // Check if anchor is block OR if parent is block and empty
              if (parentBlock && parentBlock.isEmpty()) {
                // Create the new span node
                // Generate a key for the new span
                const spanKey = generateKey();
                const newSpan = ZettelSpanNode.$createZettelSpanNode(
                  payload,
                  [],
                  spanKey,
                );
                // Replace existing empty content OR append
                parentBlock.append(newSpan);

                // Set selection to the end of the newly inserted text
                const rangeSelection = $createRangeSelection();
                rangeSelection.anchor.set(
                  newSpan.getKey(),
                  payload.length,
                  "text",
                );
                rangeSelection.focus.set(
                  newSpan.getKey(),
                  payload.length,
                  "text",
                );
                $setSelection(rangeSelection);
                return true; // Handled
              }
            }

            // Default case: Let Lexical handle insertion
            selection.insertText(payload);
            return true; // Handled
          }
        }
        return false; // Not handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Character Deletion
    editor.registerCommand<boolean>(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        selection.deleteCharacter(isBackward);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Select All
    editor.registerCommand(
      SELECT_ALL_COMMAND,
      () => {
        $selectAll();
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Copy
    editor.registerCommand(
      COPY_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        onCopyForPlainText(event, editor);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Paste
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        onPasteForPlainText(event, editor);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Cut (Delegates to Copy + Delete)
    editor.registerCommand(
      CUT_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        onCopyForPlainText(event, editor); // Use the same copy handler
        editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false); // Dispatch delete
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Delete Word
    editor.registerCommand<boolean>(
      DELETE_WORD_COMMAND,
      (isBackward) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        selection.deleteWord(isBackward);
        return true; // Handled
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    /*
     // Insert Line Break (Handles Enter Key)
     // REMOVED: This handler was preventing default block splitting.
     // By removing it, Lexical will use TextBlockNode.insertNewAfter() correctly.
     editor.registerCommand<boolean>(
       INSERT_LINE_BREAK_COMMAND,
       (selectStart) => {
         const selection = $getSelection();
         if (!$isRangeSelection(selection)) {
           return false;
         }
         selection.insertLineBreak(selectStart);
         return true; // Handled
       },
       COMMAND_PRIORITY_EDITOR,
     ),
     */
  );
}
