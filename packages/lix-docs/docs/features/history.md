# History

```ts
const lix = await openLix({});
```

```ts
// Get history for a specific file
const fileHistory = await lix.db
  .selectFrom("file_history")
  .where("file_id", "=", "README.md")
  .orderBy("depth", "desc")
  .execute();

// Get recent file changes
const recentHistory = await lix.db
  .selectFrom("file_history")
  .where("file_id", "=", "data.csv")
  .orderBy("created_at", "desc")
  .limit(10)
  .execute();
```

```ts
// Get history for a specific entity
const entityHistory = await lix.db
  .selectFrom("state_history")
  .where("entity_id", "=", "para_123")
  .where("schema_key", "=", "markdown_paragraph")
  .orderBy("created_at", "desc")
  .execute();
```

```ts
// Get history between two points in time
const rangeHistory = await lix.db
  .selectFrom("file_history")
  .where("file_id", "=", "config.json")
  .where("created_at", ">=", new Date("2024-01-01").toISOString())
  .where("created_at", "<=", new Date("2024-12-31").toISOString())
  .orderBy("created_at", "asc")
  .execute();
```