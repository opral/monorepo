import { LexicalEditor, createEditor } from "lexical";
import { registerZettelLexicalPlugin } from "../plugin.js";
import { importZettelAST } from "../import-export.js";
import { ZettelDoc } from "@opral/zettel-ast";
import { ZettelNodes } from "../nodes.js";

export type EditorProps = {};

export class ZettelEditor extends HTMLElement {
  private editor: LexicalEditor | null = null;
  private unregisterListeners: (() => void) | null = null;
  private _zettel: ZettelDoc | null = null;

  get zettel(): ZettelDoc | null {
    return this._zettel;
  }

  set zettel(value: ZettelDoc | null) {
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
      nodes: ZettelNodes,
    };

    const editor: LexicalEditor = createEditor(initialConfig);

    const container = document.createElement("div");
    container.id = "zettel-lexical-editor";
    container.setAttribute("contenteditable", "true");
    this.appendChild(container);

    editor.setRootElement(container as HTMLElement);
    this.editor = editor;

    const onZettelDocUpdate = (doc: ZettelDoc) => {
      this.dispatchEvent(
        new CustomEvent("zettel-update", { detail: { ast: doc } }),
      );
    };

    this.unregisterListeners = registerZettelLexicalPlugin(
      editor,
      onZettelDocUpdate,
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
