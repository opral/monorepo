# SQL Interface

Lix exposes all data through SQL. You can query current state, by version, or full history at the file or entity level.

## Available Tables

Lix provides six tables organized by scope and granularity:

| | **File Level** | **Entity Level** |
|---|---|---|
| **Current State** | `file` | `state` |
| **By Version** | `file_by_version` | `state_by_version` |
| **History** | `file_history` | `state_history` |

See [History](/docs/history) for details on querying historical data and using `*_by_version` and `*_history` tables.

## Current State

Query the current (latest) state of your data.

### File Level

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
```

### Entity Level

```ts
// Get a specific entity (e.g., a JSON property)
const entity = await lix.db
  .selectFrom("state")
  .where("entity_id", "=", "/example.json/name")
  .selectFirst();
```

## State By Version

Query data at a specific version, useful for comparing versions or accessing data from a different version.

### File Level

```ts
// Get a file from a specific version
const file = await lix.db
  .selectFrom("file_by_version")
  .where("path", "=", "/example.json")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("version")
      .where("name", "=", "feature-branch")
      .select("commit_id")
  )
  .selectFirst();
```

### Entity Level

```ts
// Get an entity from a specific version
const entity = await lix.db
  .selectFrom("state_by_version")
  .where("entity_id", "=", "/example.json/name")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("version")
      .where("name", "=", "feature-branch")
      .select("commit_id")
  )
  .selectFirst();
```

## History

Query past states by specifying a starting commit (`lixcol_root_commit_id`) and traversal depth.

**Common pattern for getting current version's commit:**

```ts
const currentCommit = lix.db
  .selectFrom("active_version")
  .innerJoin("version", "active_version.version_id", "version.id")
  .select("version.commit_id");
```

### File Level History

```ts
// Query file history from the active version's commit
const fileHistory = await lix.db
  .selectFrom("file_history")
  .where("path", "=", "/example.json")
  .where("lixcol_root_commit_id", "=", currentCommit)
  .orderBy("lixcol_depth", "asc")  // 0 = current, 1 = one back, etc.
  .select(["path", "data", "lixcol_depth"])
  .execute();
```

### Entity Level History

```ts
// Get history for a specific entity
const entityHistory = await lix.db
  .selectFrom("state_history")
  .where("entity_id", "=", "/example.json/name")
  .where("lixcol_root_commit_id", "=", currentCommit)
  .orderBy("lixcol_depth", "asc")
  .selectAll()
  .execute();
```

See [History](/docs/history) for more examples.

## See Also

- **[History](/docs/history)** - View complete change history
- **[Diffs](/docs/diffs)** - Compare states across time and versions
- **[Versions](/docs/versions)** - Work with branches
- **[Attribution](/docs/attribution)** - Track who changed what
