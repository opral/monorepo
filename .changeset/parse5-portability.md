---
"@lix-js/html-diff": minor
---

Switch HTML diff parsing from the browser-only `DOMParser` to server-friendly `parse5` so the library can run in Node, workers, and other isomorphic environments without DOM shims.
