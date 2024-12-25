---
"@inlang/paraglide-js": minor
---

maintenance: remove path prop from tsconfig

```diff
-"paths": {
-  "~/*": ["./src/*"]
-}
```

So not worth it "nice to have" "but it's better DX" thing. Breaks path resolving in JS. Vitest needed a vite config to resolve the paths because only TS knew how to resolve thep paths. Etc. Etc. Etc. 