import {
  LexicalEditor,
  createEditor,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  TextNode,
  ParagraphNode,
  TextFormatType,
} from "lexical";
import { registerKeybindings } from "./keybindings.js";
import { registerCommandHandlers } from "./commands.js";
import { exportZettelAST } from "./conversion.js";

export type EditorProps = {};

export class ZettelEditor extends HTMLElement {
  private editor: LexicalEditor | null = null;
  private unregisterListeners: (() => void) | null = null;

  connectedCallback() {
    const initialConfig = {
      namespace: "ZettelEditor",
      theme: {
        paragraph: "editor-paragraph",
        text: {
          bold: "editor-text-bold",
          italic: "editor-text-italic",
        },
      },
      onError: (error: Error) => {
        console.error("Lexical Error:", error);
      },
      nodes: [ParagraphNode, TextNode],
    };

    const editor: LexicalEditor = createEditor(initialConfig);

    const container = document.createElement("div");
    container.id = "zettel-lexical-editor";
    container.setAttribute("contenteditable", "true");
    this.appendChild(container);

    editor.setRootElement(container as HTMLElement);
    this.editor = editor;

    editor.registerCommand<TextFormatType>(
      FORMAT_TEXT_COMMAND,
      (formatType) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.formatText(formatType);
        }
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    const unregisterUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        const editorStateJSON = editorState.toJSON();
        const zettelAST = exportZettelAST(editorStateJSON);

        console.log(
          "Zettel AST:",
          JSON.stringify(zettelAST, null, 2),
        );
        this.dispatchEvent(
          new CustomEvent("lexical-state-updated", {
            detail: editorStateJSON,
            bubbles: true,
            composed: true,
          }),
        );
        this.dispatchEvent(
          new CustomEvent("zettel-ast-updated", {
            detail: zettelAST,
            bubbles: true,
            composed: true,
          }),
        );
      },
    );

    const unregisterKeybindings = registerKeybindings(editor);
    const unregisterCommandHandlers = registerCommandHandlers(editor);

    this.unregisterListeners = () => {
      unregisterKeybindings();
      unregisterCommandHandlers();
      unregisterUpdateListener();
    };
  }

  disconnectedCallback() {
    this.unregisterListeners?.();
    this.editor?.setRootElement(null);
    this.editor = null;
    this.innerHTML = "";
  }
}

customElements.define("zettel-editor", ZettelEditor);
