const COPY_BUTTON_ATTR = "data-mwc-copy-button";

function ensureCopyButtons(root = document) {
  const blocks = root.querySelectorAll("pre[data-mwc-codeblock]");
  for (const pre of blocks) {
    if (pre.querySelector(`[${COPY_BUTTON_ATTR}]`)) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(COPY_BUTTON_ATTR, "");
    button.className = "mwc-copy-button";
    button.textContent = "Copy";
    pre.appendChild(button);
  }
}

function handleCopyClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest(`[${COPY_BUTTON_ATTR}]`);
  if (!button) return;

  const pre = button.closest("pre[data-mwc-codeblock]");
  const code = pre?.querySelector("code")?.textContent ?? "";
  navigator.clipboard.writeText(code);

  const previous = button.textContent;
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = previous || "Copy";
  }, 1500);
}

function initCopyButtons() {
  if (window.__lixDocsCopyButtonsInitialized) return;
  window.__lixDocsCopyButtonsInitialized = true;

  ensureCopyButtons();
  document.addEventListener("click", handleCopyClick);

  const observer = new MutationObserver(() => ensureCopyButtons());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== "undefined") {
  initCopyButtons();
}

