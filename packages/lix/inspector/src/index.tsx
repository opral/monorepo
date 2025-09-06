import React from "react";
import ReactDOM from "react-dom/client";
import type { Lix } from "@lix-js/sdk";
import type { JSX } from "react";

// Store the active React root instance to allow for unmounting before re-rendering
let reactRoot: ReactDOM.Root | null = null;
let inspectorInitialized = false;
let inspectorMounted = false;
let storedLix: Lix | null = null;
let globalShortcutRegistered = false;
let pendingToggle: boolean | undefined = undefined;

// Lazily loaded modules (cached after first load)
let loadPromise: Promise<{
  App: (props: { show: boolean }) => JSX.Element;
  Provider: (props: any) => JSX.Element;
  styles: string;
  reactflowStyles: string;
}> | null = null;

async function loadModules() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      import("./App.tsx").then((m) => ({ App: m.default })),
      import("./context").then((m) => ({ Provider: m.Provider })),
      // @ts-ignore - inline CSS modules
      import("./styles.css?inline").then((m) => ({ styles: (m as any).default as string })),
      // @ts-ignore - inline CSS modules
      import("@xyflow/react/dist/style.css?inline").then((m) => ({ reactflowStyles: (m as any).default as string })),
    ]).then((arr) => ({
      App: arr[0]!.App,
      Provider: arr[1]!.Provider as any,
      styles: arr[2]!.styles,
      reactflowStyles: arr[3]!.reactflowStyles,
    }));
  }
  return loadPromise;
}

async function mountInspector({ lix, show }: { lix: Lix; show: boolean }) {
  const { App, Provider, styles, reactflowStyles } = await loadModules();

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
      <Provider lix={lix} rootContainer={container!}>
        <App show={show} />
      </Provider>
    </React.StrictMode>
  );

  inspectorMounted = true;
}

export async function initLixInspector(args: {
  lix: Lix;
  hideWelcomeMessage?: boolean;
  show?: boolean;
}): Promise<void> {
  // Store Lix for later mount; do not load heavy code unless showing immediately
  storedLix = args.lix;
  inspectorInitialized = true;
  registerGlobalShortcut();

  if (args.show) {
    await mountInspector({ lix: storedLix, show: true });
  } else {
    // Keep lazy; mount will occur on first toggle
    if (!args.hideWelcomeMessage) {
      logWelcomeMessage();
    }
    // If a toggle happened before init completed, honor it now
    if (pendingToggle !== undefined) {
      await mountInspector({ lix: storedLix, show: typeof pendingToggle === 'boolean' ? pendingToggle : true });
      pendingToggle = undefined;
    }
  }
}

/**
 * Programmatically toggle the Inspector visibility.
 * If `show` is provided, sets visibility accordingly; otherwise toggles.
 */
export async function toggleLixInspector(show?: boolean): Promise<void> {
  if (!inspectorInitialized) {
    // Defer until init is called
    pendingToggle = show;
    return;
  }
  if (!inspectorMounted) {
    if (!storedLix) {
      // Defer until init stores the Lix instance
      pendingToggle = show;
      return;
    }
    await mountInspector({ lix: storedLix, show: typeof show === "boolean" ? show : true });
    return;
  }
  const event = new CustomEvent("lix-inspector-toggle", {
    detail: { show },
  } as CustomEventInit);
  window.dispatchEvent(event);
}

function registerGlobalShortcut() {
  if (globalShortcutRegistered) return;
  const handler = (event: KeyboardEvent) => {
    // Ctrl|Cmd + Shift + O to toggle (use code for layout-agnostic detection)
    const isModifier = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isO = (event.code && event.code === "KeyO") ||
      (typeof event.key === "string" && event.key.toLowerCase() === "o");
    if (isModifier && isShift && isO) {
      event.preventDefault();
      event.stopPropagation();
      toggleLixInspector().catch((e) => {
        console.warn("Failed to toggle Lix Inspector via shortcut:", e);
      });
    }
  };
  // Capture phase to get event even if app-level handlers stop propagation
  window.addEventListener("keydown", handler, true);
  globalShortcutRegistered = true;
}

function logWelcomeMessage() {
  console.log(
    "%c    %cInspector initialized",
    `
      line-height: 1.5;
      background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAyNiAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9Ikdyb3VwIDE2MiI+CjxwYXRoIGlkPSJWZWN0b3IiIGQ9Ik0xNC43NjE4IDUuNzQ4NDJMMTYuOTIwOCA5Ljg1OTg0TDIyLjM2NzUgMC4zNTgzOThIMjUuNzEzM0wxOS4wNzIzIDExLjYyODRMMjIuNTcxMiAxNy41MDg1SDE5LjI0MDdMMTYuOTIwOCAxMy40NDNMMTQuNjM5MyAxNy41MDg1SDExLjI3MDVMMTQuNzYxOCAxMS42Mjg0TDExLjM5MyA1Ljc0ODQySDE0Ljc2MThaIiBmaWxsPSIjMDhCNUQ2Ii8+CjxwYXRoIGlkPSJWZWN0b3JfMiIgZD0iTTYuMTYyMTEgMTcuNTA4MVY1Ljc0ODA1SDkuNDIzNjhWMTcuNTA4MUg2LjE2MjExWiIgZmlsbD0iIzA4QjVENiIvPgo8cGF0aCBpZD0iVmVjdG9yXzMiIGQ9Ik0zLjUyMTEyIDAuMzkzNTU1VjE3LjY0MTZIMC4yODcxMDlWMC4zOTM1NTVIMy41MjExMloiIGZpbGw9IiMwOEI1RDYiLz4KPHBhdGggaWQ9IlJlY3RhbmdsZSAzOTEiIGQ9Ik02LjIxNTgyIDAuMzkzNTU1SDE0LjgzOTlWMy4wODg1Nkg2LjIxNTgyVjAuMzkzNTU1WiIgZmlsbD0iIzA4QjVENiIvPgo8L2c+Cjwvc3ZnPgo=")
                  no-repeat center left / 20px;
    `,
    "font-weight: bold; font-size: 12px;",
    "\n\nYou can toggle the inspector with `Ctrl` + `Shift` + `O`."
  );
}
