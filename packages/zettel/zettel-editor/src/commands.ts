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
  COMMAND_PRIORITY_EDITOR,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COPY_COMMAND,
  CUT_COMMAND, // Needed for cut helper
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND, // Import command
  INSERT_LINE_BREAK_COMMAND, // Import command
  PASTE_COMMAND,
  SELECT_ALL_COMMAND,
} from "lexical";

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
    // Insert Line Break (Handles Enter Key)
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
  );
}
