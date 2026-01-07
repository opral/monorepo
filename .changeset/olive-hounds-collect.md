---
"@inlang/sdk": patch
"@inlang/cli": patch
---

Await the Lix file queue before closing or exiting to avoid "DB has been closed" errors in CLI workflows.

Refs: https://github.com/opral/paraglide-js/issues/526
