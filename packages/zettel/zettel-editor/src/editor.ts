import {
  LexicalEditor,
  createEditor,
  $createRangeSelection,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection as $setLexicalSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
  ParagraphNode,
  TextFormatType,
} from "lexical";
import { registerKeybindings } from "./keybindings.js";
import { registerCommandHandlers } from "./commands.js";

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

    editor.update(() => {
      const root = $getRoot();
      if (root.isEmpty()) {
        const paragraph = new ParagraphNode();
        root.append(paragraph);
        const selection = $createRangeSelection();
        selection.anchor.set(paragraph.getKey(), 0, "element");
        selection.focus.set(paragraph.getKey(), 0, "element");
        $setLexicalSelection(selection);
      }
    });

    const unregisterUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        const editorStateJSON = editorState.toJSON();
        console.log(
          "Lexical Editor State (JSON):",
          JSON.stringify(editorStateJSON, null, 2),
        );
        this.dispatchEvent(
          new CustomEvent("lexical-state-updated", {
            detail: editorStateJSON,
            bubbles: true,
            composed: true,
          }),
        );
      },
    );

    const unregisterKeybindings = registerKeybindings(editor);
    const unregisterCommandHandlers = registerCommandHandlers(editor);

    this.unregisterListeners = () => {
      unregisterUpdateListener();
      unregisterKeybindings();
      unregisterCommandHandlers();
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
