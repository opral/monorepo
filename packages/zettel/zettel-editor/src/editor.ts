import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Zettel } from "@opral/zettel-ast";
import { LexicalEditor, createEditor, ParagraphNode, TextNode } from "lexical";
import { registerCommandHandlers } from "./commands.js";
import { registerKeybindings } from "./keybindings.js";
import { mergeRegister } from "@lexical/utils"; 

export type EditorProps = {
  zettel: Zettel;
};

@customElement("zettel-editor")
export class ZettelEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid #ccc;
      padding: 8px;
      min-height: 100px;
    }
    #zettel-lexical-editor {
      outline: none;
    }
  `;

  @property({ type: Object })
  accessor zettel: Zettel = [] as any;

  // Store the combined unregister function
  private unregisterListeners: (() => void) | null = null;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div id="zettel-lexical-editor" contenteditable="true"></div>
    `;
  }

  firstUpdated() {
    const editor: LexicalEditor = createEditor({
      onError: (error: Error) => {
        throw error;
      },
      nodes: [ParagraphNode, TextNode],
    });
    const container = this.renderRoot.querySelector("#zettel-lexical-editor");

    editor.setRootElement(container as HTMLElement);

    // Register both sets of listeners and store the combined unregister function
    this.unregisterListeners = mergeRegister(
      registerCommandHandlers(editor),
      registerKeybindings(editor),
    );

    // Optional: Add back a simple update listener if needed later
    // editor.registerUpdateListener(({ editorState }) => {
    //   // Process editorState if needed
    // });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Unregister all listeners when the component is removed
    if (this.unregisterListeners) {
      this.unregisterListeners();
    }
  }
}

// Declare the custom element type globally for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    "zettel-editor": ZettelEditor;
  }
}
