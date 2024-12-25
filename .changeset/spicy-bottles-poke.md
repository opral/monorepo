---
"@inlang/paraglide-js": minor
---

maintenance: remove vite in favor of tsc to build paraglide js lib

Closes https://github.com/opral/inlang-paraglide-js/issues/208

```diff
-  "build": "vite build",
+  "build": "tsc",
```

Paraglide JS used vite to build the library. This change removes vite in favor of tsc to build the library. This change is made to simplify the build process and to make it easier to maintain the library in the future.
