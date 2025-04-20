/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Adapted for Zettel Editor - Minimal command handlers
 */

import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $selectAll,
  COMMAND_PRIORITY_EDITOR,
  COPY_COMMAND,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  LexicalEditor,
  PASTE_COMMAND,
  SELECT_ALL_COMMAND,
} from "lexical";

// --- Helper Functions (Adapted from @lexical/plain-text) --- //

function onCopyForPlainText(event: ClipboardEvent, editor: LexicalEditor): void {
  event.preventDefault();
  editor.update(() => {
    const clipboardData = event.clipboardData;
    const selection = $getSelection();
    if (selection) {
      clipboardData?.setData("text/plain", selection.getTextContent());
    }
  });
}

function onPasteForPlainText(
  event: ClipboardEvent,
  editor: LexicalEditor,
): void {
  event.preventDefault();
  editor.update(
    () => {
      const selection = $getSelection();
      const text = event.clipboardData?.getData("text/plain");
      if (text != null && selection) {
        selection.insertText(text);
      }
    },
    {
      tag: "paste",
    },
  );
}

// --- Command Registration --- //

export function registerCommandHandlers(editor: LexicalEditor): () => void {
  return mergeRegister(
    // Character Deletion
    editor.registerCommand<boolean>(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        selection.deleteCharacter(isBackward);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Select All
    editor.registerCommand(
      SELECT_ALL_COMMAND,
      () => {
        $selectAll();
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Copy
    editor.registerCommand<ClipboardEvent>(
      COPY_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        if (event instanceof ClipboardEvent) {
          onCopyForPlainText(event, editor);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),

    // Paste
    editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        if (event instanceof ClipboardEvent) {
          onPasteForPlainText(event, editor);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Cut (Delegates to Copy + Delete)
    editor.registerCommand<ClipboardEvent>(
      CUT_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        if (event instanceof ClipboardEvent) {
          onCopyForPlainText(event, editor);
        }
        editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false);
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
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Insert Line Break
    editor.registerCommand<boolean>(
      INSERT_LINE_BREAK_COMMAND,
      (_selectStart) => { 
        // selectStart is unused in the plain text implementation we're mimicking
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        selection.insertLineBreak(); // Insert the line break
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );
}
