import { Component, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { hydrate, render as renderSolid } from "solid-js/web";
import { Root } from "./Root.jsx";
import { setCurrentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";
import { MetaProvider } from "@solidjs/meta";

// node polyfill
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

// import the css
import "./app.css";

// only imported client side as web components are not supported server side
// importing the shoelace components that are used.
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/badge/badge.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/details/details.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import "@shoelace-style/shoelace/dist/components/tag/tag.js";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/divider/divider.js";
import "@shoelace-style/shoelace/dist/components/tree/tree.js";
import "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";
import "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";
import "@shoelace-style/shoelace/dist/components/button-group/button-group.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";

import { clientSideEnv } from "@env";
import { initClientSession } from "@src/services/auth/lib/session/client.js";

// Initialize the session logic.
// This has to happen before the first API calls to routes that require the session logic are made.
await initClientSession();

// enable error logging via sentry in production
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: clientSideEnv.VITE_SENTRY_DSN_CLIENT,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

let isFirstRender = true;
const rootElement = document.querySelector("#root") as HTMLElement;

const [currentPage, setCurrentPage] = createSignal<Component>();
const [currentPageProps, setCurrentPageProps] = createStore<
  Record<string, unknown>
>({});

export function render(pageContext: PageContextRenderer) {
  try {
    const isEditor = pageContext.urlPathname.startsWith("/editor");
    setCurrentPageContext(pageContext);
    setCurrentPage(() => pageContext.Page);
    setCurrentPageProps(pageContext.pageProps);
    if (isFirstRender) {
      // editor is client side rendered only
      (isEditor ? renderSolid : hydrate)(
        () => (
          <MetaProvider>
            <Root page={currentPage()!} pageProps={currentPageProps} />
          </MetaProvider>
        ),
        rootElement
      );
      isFirstRender = false;
    }
  } catch (e) {
    console.error("ERROR in renderer", e);
  }
}
