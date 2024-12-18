---
"@lix-js/sdk": patch
---

refactor: rename `parent` to `from` in `createVersion()` https://github.com/opral/lix-sdk/issues/213

```diff
-await createVersion({ lix, parent: currentVersion })
+await createVersion({ lix, from: currentVersion })
```
