---
"@lix-js/sdk": patch
---

improve: `createChangeSet()` now takes an empty list of changes without throwing

Before:

```ts
await createChangeSet({
  lix, 
  // 💥 throws FOREIGN KEY CONSTRAINT violation
  changes: [],
})
```

After:

```ts
await createChangeSet({
  lix,
  // ✅ does not throw
  changes: [],
})
```

