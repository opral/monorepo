import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import type { Lix } from "@lix-js/sdk";

export interface LixInspector {
  /**
   * Renders the inspector in the given node.
   *
   * @example
   *   const inspector = await createLixInspector({ lix });
   *   inspector.render(document.getElementById("root")!);
   */
  render: (node: HTMLElement) => void;
}

// Store the active React root instance to allow for unmounting before re-rendering
let reactRoot: ReactDOM.Root | null = null;

export async function createLixInspector(args: {
  lix: Lix;
}): Promise<LixInspector> {
  console.log(args.lix);
  return {
    render: (node: HTMLElement) => {
      // 1. Ensure Shadow DOM exists directly on the host node
      let localShadowRoot: ShadowRoot;
      if (!node.shadowRoot) {
        localShadowRoot = node.attachShadow({ mode: "open" });
      } else {
        localShadowRoot = node.shadowRoot;
      }

      // 2. Create or update the React root directly inside the shadow root
      // Simplify: Always unmount if root exists, then create new root.
      if (reactRoot) {
        reactRoot.unmount();
      }
      // Pass the shadowRoot itself as the container
      reactRoot = ReactDOM.createRoot(localShadowRoot);

      // 3. Render the App component
      reactRoot.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    },
  };
}
