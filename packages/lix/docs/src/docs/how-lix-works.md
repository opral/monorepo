# How Lix Works

Lix is an embeddable change control system built on SQLite that tracks entity-level changes through a commit graph.

## Storage Layer

Lix uses **SQLite** as its storage layer. The Lix engine manages the database and exposes high-level views for working with files, entities, and history:

- `file` - Query current file states
- `state` - Query current entity states
- `change` - Access individual entity changes
- `commit` - Access commit records
- `version` - Work with branches
- `file_history` - Query historical file states
- `state_history` - Query historical entity states

These views abstract the underlying database schema, providing a clean SQL interface for change control.

## The Commit Graph

Commits form a directed acyclic graph (DAG) where each commit references its parent commit(s):

```
C4 ← C3 ← C2 ← C1
      ↖
       C5 ← C6
```

**Key concept:** Each commit contains a change set (group of entity changes) and references parent commits. This creates a graph of history that enables:

- **History** - Walk backwards from any commit to see past states
- **Versions** - Point to different commits to create parallel timelines
- **Time travel** - Query state at any commit in the graph

The commit graph is global and shared across all versions.

> See [Architecture](/docs/architecture) for details on state materialisation, change set mechanics, and the formal data model.

## Write File Flow

Writing a file invokes a plugin to detect and record changes:

### 1. File Update
```ts
await lix.db
  .updateTable("file")
  .where("path", "=", "/example.json")
  .set({ data: newFileContent })
  .execute();
```

### 2. Plugin Detects Changes

The plugin's `detectChanges` method compares before/after states:

```ts
detectChanges({ before, after, querySync }) => DetectedChange[]
```

Returns an array of detected changes:
```ts
[
  {
    schema: JSONPointerValueSchema,
    entity_id: "/user/age",
    snapshot_content: { path: "/user/age", value: 31 }
  }
]
```

### 3. Engine Creates Records

For each detected change, the engine:

1. Creates a `change` record with the new entity snapshot
2. Updates the `state` view to reflect the current entity state
3. Groups changes into a commit (change set)
4. Updates the commit graph with the new commit

### 4. History Preserved

Old entity states remain queryable through `state_history`. Nothing is ever deleted - new records are added while old ones are preserved.

## State Inheritance

Versions inherit state from their commit ancestors using a copy-on-write model:

```
Main version at C3:
- entity A (changed in C1)
- entity B (changed in C2)
- entity C (changed in C3)

Feature version at C5 (parent: C3):
- Inherits: entity A, entity B
- Changed: entity C (modified in C5)
- New: entity D (added in C5)
```

**How it works:**

- Versions point to commits in the commit graph
- When you query a version, the engine walks back through parent commits
- Entities are inherited from ancestors until a change is found
- Changes in a version only affect that version's state

**Benefits:**

- Efficient storage - unchanged entities aren't duplicated
- Fast branching - no need to copy all data
- Cheap merging - compare entities across branches

## History Queries

The `file_history` and `state_history` views use two special columns:

**`lixcol_root_commit_id`**
- The commit you're querying history from
- Walk the commit graph backwards from this point
- Filter by this to scope history to a specific timeline

**`lixcol_depth`**
- Distance from the root commit
- `0` = current state at root commit
- `1` = one commit back
- `2+` = further back in history

### Example Query

```ts
// Get file history from the active version's commit
const history = await lix.db
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
  .orderBy("lixcol_depth", "asc")
  .selectAll()
  .execute();
```

This returns all historical states of the file, ordered from current (depth 0) to oldest.

## The Engine

The Lix engine runs anywhere JavaScript runs:

**Browser**
- Runs fully client-side
- Data persists locally
- Enables offline-first applications

**Node.js**
- Runs on servers or CLI tools
- File-based persistence

**Workers**
- Runs in Web Workers or Worker Threads
- Keeps heavy processing off the main thread

**Why SQLite?**
- **Embeddable** - No separate server process
- **Cross-platform** - Works everywhere JS runs
- **Transactional** - ACID guarantees for change control
- **Queryable** - Full SQL for flexible queries
- **Compact** - Efficient binary storage format

## Data Flow Summary

```
1. File updated
   ↓
2. Plugin.detectChanges() compares before/after
   ↓
3. Returns DetectedChange[]
   ↓
4. Engine creates change records
   ↓
5. Engine updates state views
   ↓
6. Engine creates commit in commit graph
   ↓
7. History preserved, state queryable
```

**Key insight:** The engine manages all complexity. You interact through simple SQL queries against views (`file`, `state`, `file_history`, etc.), while the engine handles commit graph traversal, state inheritance, and change detection.

## Next Steps

- **[Architecture](/docs/architecture)** - Deep dive into state materialisation, change sets, and design rationale
- **[Plugins](/docs/plugins)** - Learn how plugins detect entity changes
- **[Querying Changes](/docs/querying-changes)** - Master the SQL API for working with changes and history
