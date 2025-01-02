---
"@inlang/paraglide-js": minor
---

adds `emitGitIgnore` and `emitPrettierIgnore` compiler options 

Closes https://github.com/opral/inlang-paraglide-js/issues/189

```diff
await compile({
  // ...
  options: {
+   emitPrettierIgnore: false
+   emitGitIgnore: false
  }
})
```