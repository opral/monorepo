---
"@opral/markdown-wc": major
---

Stop injecting default inline styles into rendered HTML and remove the `inlineStyles` option. The previous default look is now provided as a separate stylesheet at `@opral/markdown-wc/default.css`, which apps can import if they want the old styling.
