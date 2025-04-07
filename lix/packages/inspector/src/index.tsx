import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import type { Lix } from "@lix-js/sdk";

export type LixInspector = {
  /**
   * Renders the inspector in the given node.
   *
   * @example
   *   const inspector = await createLixInspector({ lix });
   *   inspector.render(document.getElementById("root")!);
   */
  render: (node: HTMLElement) => void;
};

export async function createLixInspector(args: {
  lix: Lix;
}): Promise<LixInspector> {
  return {
    render: (node: HTMLElement) => {
      ReactDOM.createRoot(node).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    },
  };
}
