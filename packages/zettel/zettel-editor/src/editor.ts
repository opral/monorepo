import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Zettel } from "@opral/zettel-ast";

export type EditorProps = {
  zettel: Zettel;
};

@customElement("zettel-editor")
export class ZettelEditor extends LitElement implements EditorProps {
  static styles = css``;

  @property({ type: Object })
  accessor zettel: Zettel = [] as any;

  render() {
    return html` <div>${JSON.stringify(this.zettel)}</div> `;
  }
}

// Declare the custom element type globally for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    "zettel-editor": ZettelEditor;
  }
}
