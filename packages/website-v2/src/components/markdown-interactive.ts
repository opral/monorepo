/**
 * Interactive features for markdown content
 * - Copy buttons for code blocks
 */

const COPY_BUTTON_CLASS = "mwc-copy-button";

function ensureCopyButtons(root: Document | Element = document) {
  // Target all pre elements within marketplace-markdown that have code children
  const blocks = root.querySelectorAll(".marketplace-markdown pre:has(> code)");
  for (const pre of blocks) {
    if (pre.querySelector(`.${COPY_BUTTON_CLASS}`)) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.className = COPY_BUTTON_CLASS;
    button.textContent = "Copy";
    
    // Ensure pre has relative positioning for absolute button
    (pre as HTMLElement).style.position = "relative";
    pre.appendChild(button);
  }
}

function handleCopyClick(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest(`.${COPY_BUTTON_CLASS}`);
  if (!button) return;

  const pre = button.closest("pre");
  const code = pre?.querySelector("code")?.textContent ?? "";
  navigator.clipboard.writeText(code);

  const previous = button.textContent;
  button.textContent = "Copied!";
  window.setTimeout(() => {
    button.textContent = previous || "Copy";
  }, 1500);
}

declare global {
  interface Window {
    __inlangMarkdownInteractiveInitialized?: boolean;
  }
}

export function initMarkdownInteractive() {
  if (typeof window === "undefined") return;
  if (window.__inlangMarkdownInteractiveInitialized) return;
  window.__inlangMarkdownInteractiveInitialized = true;

  ensureCopyButtons();
  document.addEventListener("click", handleCopyClick);

  // Watch for new code blocks added to the DOM
  const observer = new MutationObserver(() => ensureCopyButtons());
  observer.observe(document.body, { childList: true, subtree: true });
}

// Auto-initialize when imported
if (typeof window !== "undefined") {
  initMarkdownInteractive();
}

