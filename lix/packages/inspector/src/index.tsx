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
      const rootNode = document.createElement("div");
      node.appendChild(rootNode);
      // COULDN'T GET SHADOW DOM TO WORK PROPERLY WITH SHADCN STYLES
      // NEEDS A REVIST IN THE FUTURE
      // if (!node.shadowRoot) {
      //   localShadowRoot = node.attachShadow({ mode: "open" });
      // } else {
      //   localShadowRoot = node.shadowRoot;
      // }

      // https://github.com/tailwindlabs/tailwindcss/discussions/1935#discussioncomment-12135380
      // const sheet = new CSSStyleSheet();
      // sheet.replaceSync(styles.replaceAll(":root", ":host"));
      // localShadowRoot.adoptedStyleSheets = [sheet];

      // Create or update the React root directly inside the shadow root
      // Simplify: Always unmount if root exists, then create new root.
      if (reactRoot) {
        reactRoot.unmount();
      }
      // Pass the rootContainer as the container
      reactRoot = ReactDOM.createRoot(rootNode);

      reactRoot.render(
        <React.StrictMode>
          <style>{styles}</style>
          <Provider lix={args.lix} rootContainer={rootNode}>
            <RouterProvider router={router} />
          </Provider>
        </React.StrictMode>
      );
    },
  };
}
