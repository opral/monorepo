# SQL Interface

Lix exposes all data through SQL. You can query current state, by version, or full history at the file or entity level.

## Available Tables

Lix provides six tables organized by scope and granularity:

|                   | **File Level**    | **Entity Level**   |
| ----------------- | ----------------- | ------------------ |
| **Current State** | `file`            | `state`            |
| **By Version**    | `file_by_version` | `state_by_version` |
| **History**       | `file_history`    | `state_history`    |

See [History](/docs/history) for details on querying historical data and using `*_by_version` and `*_history` tables.

## Table Schemas

Use these schema references when building queries. Nullable columns are marked as such; timestamps are ISO strings stored as TEXT in SQLite.

### `state` (active version)

| Column                      | Type            | Notes                                         |
| --------------------------- | --------------- | --------------------------------------------- |
| `entity_id`                 | TEXT            | Entity identifier unique within a file/schema |
| `schema_key`                | TEXT            | Schema key (matches your `x-lix-key`)         |
| `file_id`                   | TEXT            | Owning file ID                                |
| `plugin_key`                | TEXT            | Plugin that owns the entity type              |
| `snapshot_content`          | JSON            | Current JSON payload                          |
| `schema_version`            | TEXT            | Schema version string (e.g., `1.0`)           |
| `created_at`                | TEXT            | When this version-local state was created     |
| `updated_at`                | TEXT            | Last update time within the active version    |
| `inherited_from_version_id` | TEXT, nullable  | Source version when inherited                 |
| `change_id`                 | TEXT            | Change that produced the state                |
| `untracked`                 | INTEGER/BOOLEAN | `1` for untracked UI/ephemeral state          |
| `commit_id`                 | TEXT            | Commit that contains the change               |
| `writer_key`                | TEXT, nullable  | Writer attribution for echo suppression       |
| `metadata`                  | JSON, nullable  | Metadata attached to the originating change   |

### `state_by_version` (all versions)

| Column                      | Type            | Notes                                         |
| --------------------------- | --------------- | --------------------------------------------- |
| `entity_id`                 | TEXT            | Entity identifier unique within a file/schema |
| `schema_key`                | TEXT            | Schema key (matches your `x-lix-key`)         |
| `file_id`                   | TEXT            | Owning file ID                                |
| `version_id`                | TEXT            | Version that owns this row                    |
| `plugin_key`                | TEXT            | Plugin that owns the entity type              |
| `snapshot_content`          | JSON            | JSON payload for this version                 |
| `schema_version`            | TEXT            | Schema version string (e.g., `1.0`)           |
| `created_at`                | TEXT            | When this version-local state was created     |
| `updated_at`                | TEXT            | Last update time within this version          |
| `inherited_from_version_id` | TEXT, nullable  | Source version when inherited                 |
| `change_id`                 | TEXT            | Change that produced the state                |
| `untracked`                 | INTEGER/BOOLEAN | `1` for untracked UI/ephemeral state          |
| `commit_id`                 | TEXT            | Commit that contains the change               |
| `writer_key`                | TEXT, nullable  | Writer attribution for echo suppression       |
| `metadata`                  | JSON, nullable  | Metadata attached to the originating change   |

### `state_history` (read-only history)

| Column             | Type           | Notes                                               |
| ------------------ | -------------- | --------------------------------------------------- |
| `entity_id`        | TEXT           | Entity identifier unique within a file/schema       |
| `schema_key`       | TEXT           | Schema key (matches your `x-lix-key`)               |
| `file_id`          | TEXT           | Owning file ID                                      |
| `plugin_key`       | TEXT           | Plugin that owns the entity type                    |
| `snapshot_content` | JSON           | Historical JSON payload at this point               |
| `metadata`         | JSON, nullable | Metadata from the change that produced the state    |
| `schema_version`   | TEXT           | Schema version string (e.g., `1.0`)                 |
| `change_id`        | TEXT           | Change that produced the historical state           |
| `commit_id`        | TEXT           | Commit where this state was created                 |
| `root_commit_id`   | TEXT           | Commit you are traversing history from              |
| `depth`            | INTEGER        | Distance from `root_commit_id` (`0` = root)         |
| `version_id`       | TEXT           | Always `global` (history is global across versions) |

## Current State

Query the current (latest) state of your data.

### File Level

```ts
// Get all files in the current version
const files = await lix.db.selectFrom("file").selectAll().execute();

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
      .select("commit_id"),
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
      .select("commit_id"),
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
  .orderBy("lixcol_depth", "asc") // 0 = current, 1 = one back, etc.
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
