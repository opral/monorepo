import React from "react";
import ReactDOM from "react-dom/client";
import type { Lix } from "@lix-js/sdk";
import {
  createBrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { routes } from "./routes/routes.tsx";
import styles from "./styles.css?inline";
import { LixProvider } from "./hooks/use-lix.ts";

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
  routerType?: "memory" | "browser";
}): Promise<LixInspector> {
  const routerType = args.routerType ?? "memory";

  const router =
    routerType === "memory"
      ? createMemoryRouter(routes)
      : createBrowserRouter(routes);

  return {
    render: (node: HTMLElement) => {
      // Ensure Shadow DOM exists directly on the host node
      let localShadowRoot: ShadowRoot;
      if (!node.shadowRoot) {
        localShadowRoot = node.attachShadow({ mode: "open" });
      } else {
        localShadowRoot = node.shadowRoot;
      }

      // Create or update the React root directly inside the shadow root
      // Simplify: Always unmount if root exists, then create new root.
      if (reactRoot) {
        reactRoot.unmount();
      }
      // Pass the shadowRoot itself as the container
      reactRoot = ReactDOM.createRoot(localShadowRoot);

      reactRoot.render(
        <React.StrictMode>
          <style>{styles}</style>
          <LixProvider lixInstance={args.lix}>
            <RouterProvider router={router} />
          </LixProvider>
        </React.StrictMode>
      );
    },
  };
}
