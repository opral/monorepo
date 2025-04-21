import { LexicalEditor, createEditor } from "lexical";
import { registerZettelLexicalPlugin } from "../plugin.js";
import { ZettelDoc } from "@opral/zettel-ast";
import { ZettelNodes } from "../nodes.js";
import { fromLexicalState, toLexicalState } from "../parse-serialize.js";

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
      const lexicalState = toLexicalState(this._zettel);
      this.editor.setEditorState(this.editor.parseEditorState(lexicalState));
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

    editor.registerUpdateListener(() => {
      const lexicalState = editor.getEditorState().toJSON();
      const zettelDoc = fromLexicalState(lexicalState);
      this.dispatchEvent(
        new CustomEvent("zettel-update", { detail: { ast: zettelDoc } }),
      );
    });

    const container = document.createElement("div");
    container.id = "zettel-lexical-editor";
    container.setAttribute("contenteditable", "true");
    this.appendChild(container);

    editor.setRootElement(container as HTMLElement);

    this.editor = editor;

    this.unregisterListeners = registerZettelLexicalPlugin(editor);

    if (this._zettel) {
      const lexicalState = toLexicalState(this._zettel);
      editor.setEditorState(editor.parseEditorState(lexicalState));
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
