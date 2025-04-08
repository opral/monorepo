import React from "react";
import ReactDOM from "react-dom/client";
import type { Lix } from "@lix-js/sdk";
// @ts-ignore - styles.css is not a module
import styles from "./styles.css?inline";
// @ts-ignore - reactflowStyles is not a module
import reactflowStyles from "@xyflow/react/dist/style.css?inline";
import { Provider } from "./context";
import App from "./App.tsx";

// Store the active React root instance to allow for unmounting before re-rendering
let reactRoot: ReactDOM.Root | null = null;

export async function initLixInspector(args: { lix: Lix }): Promise<void> {
  // Create a fixed position overlay container for the inspector
  const container = document.createElement("div");
  container.id = "lix-inspector";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.zIndex = "9999";

  container.attachShadow({ mode: "open" });

  // https://github.com/tailwindlabs/tailwindcss/issues/15005#issuecomment-2737489813
  const shadowSheet = new CSSStyleSheet();
  shadowSheet.replaceSync(styles.replace(/:root/gu, ":host"));

  const reactflowSheet = new CSSStyleSheet();
  reactflowSheet.replaceSync(reactflowStyles);

  const propertyPolyfill = new CSSStyleSheet();
  for (const rule of shadowSheet.cssRules) {
    if (rule instanceof CSSPropertyRule) {
      propertyPolyfill.insertRule(rule.cssText);
    }
  }

  document.adoptedStyleSheets.push(propertyPolyfill);

  container.shadowRoot?.adoptedStyleSheets.push(shadowSheet);
  container.shadowRoot?.adoptedStyleSheets.push(reactflowSheet);

  // Add the overlay container to the document body instead of the provided node
  document.body.appendChild(container);

  // Create a style element to add padding to the body to prevent content from being hidden under the topbar
  const styleElement = document.createElement("style");
  styleElement.id = "lix-inspector-style";
  document.head.appendChild(styleElement);

  // Simplify: Always unmount if root exists, then create new root.
  if (reactRoot) {
    reactRoot.unmount();
  }

  // Create new root in the overlay container
  reactRoot = ReactDOM.createRoot(container.shadowRoot!);

  reactRoot.render(
    <React.StrictMode>
      <Provider lix={args.lix} rootContainer={container!}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}
