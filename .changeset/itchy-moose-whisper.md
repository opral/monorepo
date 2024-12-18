---
"@lix-js/sdk": patch
---

refactor: rename `change_queue` to `file_queue` https://github.com/opral/lix-sdk/issues/168

```diff
-db.selectFrom("change_queue")
+db.selectFrom("file_queue")
```