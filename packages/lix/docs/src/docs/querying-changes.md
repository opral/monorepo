# Querying Changes

Lix exposes everything through SQL. This means:

- **Flexible queries** - Combine filters, joins, aggregations
- **Programmatic access** - Build UIs that show exactly what you need
- **Custom workflows** - Create automation based on specific changes
- **No learning curve** - If you know SQL, you know how to query Lix

## Core Concept

Every change in Lix creates records in the database:

```
Update a file
  ↓
Plugin detects entity changes
  ↓
New state records are created
  ↓
Old records are preserved
  ↓
Query current or historical state
```

**Nothing is ever deleted**. This is how Lix provides complete history, undo/redo, and time travel.

## The Three Types of Queries

### 1. Current State

Query the current (latest) state of your data:

```ts
// Get all files in the current version
const files = await lix.db
  .selectFrom("file")
  .selectAll()
  .execute();

// Get a specific file
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.json")
  .selectFirst();

// Get a specific entity (e.g., a JSON property)
const entity = await lix.db
  .selectFrom("state")
  .where("entity_id", "=", "/example.json/name")
  .selectFirst();
```

This is like reading from a normal database—you get the current data.

### 2. File History

Query past states of an entire file using `file_history`:

```ts
// Query file history from the active version's commit
const fileHistory = await lix.db
  .selectFrom("file_history")
  .where("path", "=", "/example.json")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("active_version")
      .innerJoin("version", "active_version.version_id", "version.id")
      .select("version.commit_id")
  )
  .orderBy("lixcol_depth", "asc")  // 0 = current, higher = older
  .select(["path", "data", "lixcol_depth"])
  .execute();
```

> **Tip:** Always filter by `lixcol_root_commit_id` (and typically `lixcol_depth = 0` for the head) to scope history to a single checkpoint and avoid mixing multiple timelines.

See [History](/docs/history) for detailed examples.

### 3. Entity History

Query past states of a specific entity (like a JSON property, CSV row, or markdown paragraph) using `state_history`:

```ts
// Get history for a specific entity
const entityHistory = await lix.db
  .selectFrom("state_history")
  .where("entity_id", "=", "/example.json/name")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("active_version")
      .innerJoin("version", "active_version.version_id", "version.id")
      .select("version.commit_id")
  )
  .orderBy("lixcol_depth", "asc")
  .selectAll()
  .execute();
```

This is useful for building features like comment threads or fine-grained audit trails.

See [History](/docs/history) for detailed examples.

## Next Steps

Now that you understand querying, dive deeper into specific features:

- **[History](/docs/history)** - View complete change history
- **[Diffs](/docs/diffs)** - Compare states across time and versions
- **[Versions](/docs/versions)** - Work with branches
- **[Attribution](/docs/attribution)** - Track who changed what
- **[Restore](/docs/restore)** - Restore previous states and undo changes
