---
"@lix-js/sdk": patch
---

improve: `applyChanges()` gets a `skipFileQueue` options

https://github.com/opral/lix-sdk/issues/281

```diff
applyChanges({
  lix,
  changes,
+ skipFileQueue: false,
});
```

