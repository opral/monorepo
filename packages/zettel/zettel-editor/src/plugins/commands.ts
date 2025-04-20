import { mergeRegister } from "@lexical/utils";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $selectAll,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  LexicalEditor,
  PASTE_COMMAND,
  SELECT_ALL_COMMAND,
} from "lexical";
import { $createZettelTextBlockNode, $createZettelSpanNode } from "../nodes.js";

function onCopyForPlainText(
  event: ClipboardEvent,
  editor: LexicalEditor,
): void {
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

export function registerEditorCommands(editor: LexicalEditor): () => void {
  return mergeRegister(
    // Keybindings: Cmd/Ctrl+B/I for formatting
    editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        const { key, metaKey, ctrlKey, altKey } = event;
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
        // Handle printable character input directly
        if (key.length === 1 && !metaKey && !ctrlKey && !altKey) {
          event.preventDefault();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertText(key);
            }
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),

    // Enter key: insert new block
    editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        console.log("[commands] KEY_ENTER_COMMAND");
        const root = $getRoot();
        const newBlock = $createZettelTextBlockNode();
        const newSpan = $createZettelSpanNode("");
        newBlock.append(newSpan);
        root.append(newBlock);
        newBlock.select();
        return true;
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

    // Cut (delegates to Copy + Delete)
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
  );
}
