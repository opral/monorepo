---
"@lix-js/sdk": patch
---

Fix observe invalidation for file queries so file reads re-emit when state commits touch the same file, preventing stale data from being served.
