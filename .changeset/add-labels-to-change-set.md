---
"@lix-js/sdk": patch
---

improve: `createChangeSet()` now accepts labels to associate with the change set

Before:

```ts
await createChangeSet({
  lix,
  changes: [],
  // ❌ no way to add labels
})
```

After:

```ts
// Get existing labels
const labels = await lix.db.selectFrom("label").selectAll().execute();

await createChangeSet({
  lix,
  changes: [],
  // ✅ associate labels with the change set
  labels
})
```
