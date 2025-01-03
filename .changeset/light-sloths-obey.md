---
"@inlang/marketplace-registry": major
---

breaking: only allow https links and resolve relative links from the marketplace manifest

```diff
-  "readme": "./<repo>/x.md",
// paths are now resolved from the marketplace manifest
+  "readme": "./x.md",
```
