import { SignalWatcher } from "@lit-labs/preact-signals";
import { LitElement } from "lit-element";

export class BaseElement extends SignalWatcher(LitElement) {
  // @ts-ignore
  protected createRenderRoot(): Element | ShadowRoot {
    const root = this.attachShadow({ mode: "open" });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/style.css";
    // inject tailwind css global styles
    root.appendChild(link);
    return root;
  }
}
