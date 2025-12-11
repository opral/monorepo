---
"@opral/markdown-wc": minor
---

Add support for GitHub-style alert blockquotes (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`). Alerts render as standard `<blockquote>` elements annotated with `data-mwc-alert`, and include a hideable `[data-mwc-alert-marker]` span for site-specific styling (e.g. `blockquote[data-mwc-alert="note"] { ... }` and `blockquote[data-mwc-alert] [data-mwc-alert-marker]{display:none}`). Also add an opt-in `externalLinks` option to open absolute http(s) links in a new tab with `rel="noopener noreferrer"`.
