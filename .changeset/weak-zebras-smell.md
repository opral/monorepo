---
"@opral/markdown-wc": minor
---

Ensure interoperability and portability by letting documents import components via frontmatter.

```diff
title: "Hello World"
+import: 
+  - "https://example.com/doc-card.js"
+  - "https://example.com/doc-button.js"
---

# Hello World
```