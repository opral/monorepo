import {
  LexicalEditor,
  createEditor,
  TextNode,
  ParagraphNode,
  SerializedEditorState,
} from "lexical";
import { registerZettelLexicalPlugin } from "./plugins/zettel-lexical-plugin.js";
import { importZettelAST } from "./plugins/conversion.js";
import { Zettel, generateKey } from "@opral/zettel-ast";
import { ZettelTextBlockNode, ZettelSpanNode } from "./nodes.js";

export type EditorProps = {};

export class ZettelEditor extends HTMLElement {
  private editor: LexicalEditor | null = null;
  private unregisterListeners: (() => void) | null = null;
  private _zettel: Zettel | null = null;

  get zettel(): Zettel | null {
    return this._zettel;
  }

  set zettel(value: Zettel | null) {
    this._zettel = value;
    if (this.editor && this._zettel) {
      importZettelAST(this._zettel, this.editor);
    }
  }

  connectedCallback() {
    const initialConfig = {
      onError: (error: Error) => {
        console.error("Lexical Error:", error);
      },
      nodes: [ZettelTextBlockNode, ZettelSpanNode],
    };

    const editor: LexicalEditor = createEditor(initialConfig);

    const container = document.createElement("div");
    container.id = "zettel-lexical-editor";
    container.setAttribute("contenteditable", "true");
    this.appendChild(container);

    editor.setRootElement(container as HTMLElement);
    this.editor = editor;

    const handleZettelUpdate = (
      zettelAst: Zettel,
      lexicalState: SerializedEditorState,
    ) => {
      this.dispatchEvent(
        new CustomEvent("zettel-update", { detail: { ast: zettelAst } }),
      );
      this.dispatchEvent(
        new CustomEvent("lexical-update", { detail: { state: lexicalState } }),
      );
    };

    this.unregisterListeners = registerZettelLexicalPlugin(
      editor,
      handleZettelUpdate,
    );

    if (this._zettel) {
      importZettelAST(this._zettel, editor);
    }
  }

  disconnectedCallback() {
    this.unregisterListeners?.();
    this.editor?.setRootElement(null);
    this.editor = null;
    this.innerHTML = "";
  }
}

customElements.define("zettel-editor", ZettelEditor);
