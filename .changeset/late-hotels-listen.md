---
"@lix-js/sdk": patch
---

fix: duplicate file queue entries when using an upsert. An `insertInto` with `onConflict` could lead to duplicate change detections.

```typescript
// This operation now correctly generates only two changes:
// 1. An initial insert change.
// 2. An update change due to the conflict.
await lix.db
  .insertInto("file")
  .values([
    { id: "file1", path: "/a.txt", data: data0 },
    { id: "file1", path: "/a.txt", data: data1 }, // Causes conflict
  ])
  .onConflict((oc) => oc.doUpdateSet({ data: (eb) => eb.ref("excluded.data") }))
  .execute();
```
