import React from "react";
import ReactDOM from "react-dom/client";
import type { Lix } from "@lix-js/sdk";
import {
  createBrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { routes } from "./routes.tsx";
import styles from "./styles.css?inline";
import { Provider } from "./context";

// Unique ID for the shadow DOM root node
export const LIX_INSPECTOR_SHADOW_ROOT_ID = "lix-inspector-shadow-root";

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

      // Add an ID to the shadow root's first child for easy access
      const rootContainer = document.createElement("div");
      rootContainer.id = LIX_INSPECTOR_SHADOW_ROOT_ID;

      // Clear any existing content in the shadow root
      localShadowRoot.innerHTML = "";
      localShadowRoot.appendChild(rootContainer);

      // Create or update the React root directly inside the shadow root
      // Simplify: Always unmount if root exists, then create new root.
      if (reactRoot) {
        reactRoot.unmount();
      }
      // Pass the rootContainer as the container
      reactRoot = ReactDOM.createRoot(rootContainer);

      reactRoot.render(
        <React.StrictMode>
          <style>{styles}</style>
          <Provider lix={args.lix} rootContainer={rootContainer}>
            <RouterProvider router={router} />
          </Provider>
        </React.StrictMode>
      );
    },
  };
}
