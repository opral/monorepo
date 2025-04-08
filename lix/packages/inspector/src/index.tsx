import React from "react";
import ReactDOM from "react-dom/client";
import type { Lix } from "@lix-js/sdk";
import {
  createBrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { routes } from "./routes.tsx";
// @ts-ignore - styles.css is not a module
import styles from "./styles.css?inline";
import { Provider } from "./context";

export interface LixInspector {
  /**
   * Renders the inspector in the given node.
   *
   * @example
   *   const inspector = await createLixInspector({ lix });
   *   inspector.render(document.getElementById("root")!);
   */
  render: (_node: HTMLElement) => void;
}

// Store the active React root instance to allow for unmounting before re-rendering
let reactRoot: ReactDOM.Root | null = null;

export async function initLixInspector(args: {
  lix: Lix;
  routerType?: "memory" | "browser";
}): Promise<LixInspector> {
  const routerType = args.routerType ?? "memory";

  const router =
    routerType === "memory"
      ? createMemoryRouter(routes)
      : createBrowserRouter(routes);

  return {
    render: (_node: HTMLElement) => {
      // Create a fixed position overlay container for the inspector
      const overlayContainer = document.createElement("div");
      overlayContainer.id = "lix-inspector-overlay";
      overlayContainer.style.position = "fixed";
      overlayContainer.style.top = "0";
      overlayContainer.style.left = "0";
      overlayContainer.style.width = "100%";
      overlayContainer.style.zIndex = "9999";
      
      // Add the overlay container to the document body instead of the provided node
      document.body.appendChild(overlayContainer);
      
      // Create a style element to add padding to the body to prevent content from being hidden under the topbar
      const styleElement = document.createElement("style");
      styleElement.id = "lix-inspector-style";
      document.head.appendChild(styleElement);
      
      // Simplify: Always unmount if root exists, then create new root.
      if (reactRoot) {
        reactRoot.unmount();
      }
      
      // Create new root in the overlay container
      reactRoot = ReactDOM.createRoot(overlayContainer);

      reactRoot.render(
        <React.StrictMode>
          <style>{styles}</style>
          <Provider lix={args.lix} rootContainer={overlayContainer}>
            <RouterProvider router={router} />
          </Provider>
        </React.StrictMode>
      );
    },
  };
}
