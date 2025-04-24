import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
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
  TextFormatType,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $createZettelTextBlockNode, $createZettelSpanNode } from "./nodes.js";
import { toPlainText } from "@opral/zettel-ast";
import { fromLexicalState, toLexicalState } from "./parse-serialize.js";
import { fromHtmlString, toHtmlString } from "@opral/zettel-html";

/**
 * Registers the core functionality for the Zettel editor,
 * including keybindings, command handling, and Zettel AST conversion.
 *
 *
 * @returns A cleanup function to unregister listeners.
 */
export function registerZettelLexicalPlugin(editor: LexicalEditor): () => void {
  const root = editor.getRootElement();

  root?.setAttribute("data-zettel-doc", "true");

  // Register standard keybindings and command handlers
  const unregisterCommandHandlers = mergeRegister(
    // Format text (bold, italic, etc)
    editor.registerCommand<TextFormatType>(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText(payload);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
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
      // @prettier-ignore
    ),

    // Enter key: insert new block
    editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      () => {
        const root = $getRoot();
        const newBlock = $createZettelTextBlockNode();
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

    // Copy (Zettel HTML)
    editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent | null) => {
        // 1. Get the current selection as Zettel AST
        const state = editor.getEditorState();
        // Use your existing function to convert Lexical state to Zettel AST
        const zettelDoc = fromLexicalState(state.toJSON());
        const html = toHtmlString(zettelDoc);
        // 2. Set clipboard data
        if (event && "clipboardData" in event && event.clipboardData) {
          // Use ClipboardEvent clipboardData API
          event.clipboardData.setData("text/plain", toPlainText(zettelDoc));
          event.clipboardData.setData("text/html", html);
          event.clipboardData.setData("text/zettel", JSON.stringify(zettelDoc));
          event.preventDefault();
          return true;
        }
        if (typeof window !== "undefined") {
          const clipboard = (window.navigator as any).clipboard;
          if (clipboard && clipboard.write) {
            // Use Clipboard API if available
            clipboard.write([
              new window.ClipboardItem({
                "text/plain": new Blob([toPlainText(zettelDoc)], {
                  type: "text/plain",
                }),
                "text/html": new Blob([html], { type: "text/html" }),
                "text/zettel": new Blob([JSON.stringify(zettelDoc)], {
                  type: "text/zettel",
                }),
              }),
            ]);
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Paste (Zettel: prefer text/zettel, fallback to html, fallback to plain text)
    editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent | InputEvent | null) => {
        if (!event) return false;
        const clipboardData = (event as ClipboardEvent).clipboardData;
        if (!clipboardData) return false;

        // 1. Try text/zettel (raw AST)
        if (Array.from(clipboardData.types).includes("text/zettel")) {
          try {
            const astJson = clipboardData.getData("text/zettel");
            const zettelDoc = JSON.parse(astJson);
            const lexicalState = toLexicalState(zettelDoc);
            editor.setEditorState(editor.parseEditorState(lexicalState));
            return true;
          } catch (e) {
            console.error(e);
            // fall through to next format
          }
        }
        // 2. Try text/html (Zettel HTML)
        if (Array.from(clipboardData.types).includes("text/html")) {
          const html = clipboardData.getData("text/html");
          try {
            const zettelDoc = fromHtmlString(html);
            const lexicalState = toLexicalState(zettelDoc);
            editor.setEditorState(editor.parseEditorState(lexicalState));
            return true;
          } catch (e) {
            console.error(e);
            // fall through to next format
          }
        }
        // 3. Fallback: text/plain (insert as new block)
        if (Array.from(clipboardData.types).includes("text/plain")) {
          const text = clipboardData.getData("text/plain");
          editor.update(() => {
            const root = $getRoot();
            const zettelTextBlock = $createZettelTextBlockNode();
            const zettelSpan = $createZettelSpanNode(text);
            zettelTextBlock.append(zettelSpan);
            root.append(zettelTextBlock);
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
      // @prettier-ignore
    ),

    // Cut (delegates to Copy + Delete)
    editor.registerCommand<ClipboardEvent>(
      CUT_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );

  // Return a function that unregisters all listeners
  return unregisterCommandHandlers;
}
