---
"@inlang/paraglide-js": minor
---

adds `emitDts` compiler option https://github.com/opral/inlang-paraglide-js/issues/288

```diff
await compile({
  // ...
  options: {
+   emitDts: true
  }
})
```

Projects can now select if TypeScript declaration file should be emitted. The need for the `allowJs: true` option in TypeScript configs becomes redundant at the cost of slower compilation times.