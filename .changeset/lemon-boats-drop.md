---
"@lix-js/sdk": patch
---

Add polyfill for crypto.getRandomValues to ensure nanoid works in environments without crypto support (like older versions of Node in Stackblitz). Fixes https://github.com/opral/lix-sdk/issues/258
