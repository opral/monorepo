import {
  LexicalEditor,
  createEditor,
  TextNode,
  ParagraphNode,
  SerializedEditorState,
} from "lexical";
import { registerZettelLexicalPlugin } from "./plugins/zettel-lexical-plugin.js";
import { importZettelAST } from "./plugins/conversion.js";
import { registerEmojiPickerPlugin } from "./plugins/emoji-picker-plugin.js";
import { ZettelDoc } from "@opral/zettel-ast";
import { ZettelTextBlockNode, ZettelSpanNode } from "./nodes.js";

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
      nodes: [
        ZettelTextBlockNode,
        ZettelSpanNode,
        {
          replace: ParagraphNode,
          with: () => new ZettelTextBlockNode(),
          withKlass: ZettelTextBlockNode,
        },
        {
          replace: TextNode,
          with: () => new ZettelSpanNode(""),
          withKlass: ZettelSpanNode,
        },
      ],
    };

    const editor: LexicalEditor = createEditor(initialConfig);

    // Register Emoji Picker Plugin
    registerEmojiPickerPlugin(editor);

    const container = document.createElement("div");
    container.id = "zettel-lexical-editor";
    container.setAttribute("contenteditable", "true");
    this.appendChild(container);

    editor.setRootElement(container as HTMLElement);
    this.editor = editor;

    const handleZettelUpdate = (
      zettelAst: ZettelDoc,
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
