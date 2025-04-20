import { LexicalEditor, createEditor, TextNode, ParagraphNode } from "lexical";
import { registerZettelLexicalPlugin } from "./plugins/zettel-lexical-plugin.js";
import { Zettel } from "@opral/zettel-ast";

export type EditorProps = {};

export class ZettelEditor extends HTMLElement {
  private editor: LexicalEditor | null = null;
  private unregisterListeners: (() => void) | null = null;

  connectedCallback() {
    const initialConfig = {
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

    const handleZettelUpdate = (ast: Zettel) => {
      this.dispatchEvent(
        new CustomEvent("zettel-update", { detail: { ast: ast } }),
      );
    };

    this.unregisterListeners = registerZettelLexicalPlugin(
      editor,
      handleZettelUpdate,
    );
  }

  disconnectedCallback() {
    this.unregisterListeners?.();
    this.editor?.setRootElement(null);
    this.editor = null;
    this.innerHTML = "";
  }
}

customElements.define("zettel-editor", ZettelEditor);
