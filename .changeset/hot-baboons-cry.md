---
"@lix-js/sdk": patch
---

improve: remove top level await in json parsing

required for lix apps that transpile to CJS. CJS does not support top level await.
see https://github.com/evanw/esbuild/issues/253