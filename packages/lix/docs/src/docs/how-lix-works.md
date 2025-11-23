# How Lix Works

Lix is a change control system that runs in your application—in the browser, Node.js, or anywhere JavaScript runs. Think of it as "Git inside your app," but designed for structured data instead of text files.

## The Big Picture

At its core, Lix tracks changes to **entities** (meaningful units of data) within files. Instead of treating files as opaque blobs or tracking line-by-line diffs like Git, Lix understands the _structure_ of your data.

```
Your File (JSON, CSV, Excel, etc.)
    ↓
Plugin parses it into entities
    ↓
Lix tracks changes to each entity
    ↓
Query history, create branches, propose changes
```

This entity-level understanding enables:
- **Fine-grained diffs** - "The `age` property changed from 30 to 31" instead of "line 5 changed"
- **Smart merging** - Changes to different entities can merge automatically
- **Granular history** - Query the history of a specific property or field
- **Change proposals** - Review and approve changes before applying them

## How It Works

### 1. Files and Plugins

When you insert a file into Lix, you specify which **plugin** should handle it. Plugins understand file formats:

```ts
await lix.db
  .insertInto("file")
  .values({
    path: "/data.json",
    data: fileContent,
    plugin_key: "plugin_json",  // JSON plugin handles this file
  })
  .execute();
```

The plugin is responsible for:
- **Parsing** the file into entities
- **Detecting** what changed when the file is updated
- **Serializing** entities back into the original format

### 2. Entities and State

An **entity** is a meaningful, addressable unit of data. What counts as an entity depends on the file type:

| File Type | Example Entities |
|-----------|------------------|
| JSON | A property path like `user.name` or `settings.theme` |
| Spreadsheet | A row, or a specific cell |
| Document | A paragraph, heading, or code block |

When a plugin detects a change, it records the entity's new state in Lix's database. Each state record captures:
- **What** changed (entity ID)
- **When** it changed (timestamp)
- **The new value** (snapshot content)
- **Which version** it belongs to (version ID)

### 3. Versions (Branches)

Like Git branches, Lix supports multiple parallel **versions** of your data. You can:

- Create experimental versions without affecting the main data
- Work on multiple features simultaneously
- Compare differences between versions
- Merge changes from one version to another

```ts
// Create a new version (branch)
await lix.db
  .insertInto("version")
  .values({
    name: "feature-experiment",
    parent_version_id: currentVersionId,
  })
  .execute();

// Switch the active version
await lix.db
  .updateTable("active_version")
  .set({ version_id: newVersionId })
  .execute();
```

### 4. Change Control Features

With files, entities, and versions in place, Lix provides Git-like capabilities:

- **[History](/docs/history)** - View past states of any entity
- **[Diffs](/docs/diffs)** - Compare entity states across versions or time
- **[Attribution](/docs/attribution)** - See who changed what and when (blame)
- **[Change Proposals](/docs/change-proposals)** - Review and approve changes before merging
- **[Validation Rules](/docs/validation-rules)** - Enforce data quality constraints
- **[Undo/Redo](/docs/undo-redo)** - Step through change history
- **[Restore](/docs/restore)** - Time travel to previous states

### 5. Queries, Not Commands

Unlike Git's command-line interface (`git log`, `git diff`, `git blame`), Lix exposes its data through **SQL queries**. This makes change control queryable and programmable:

```ts
// Find all changes to a specific entity in the last 24 hours
const recentChanges = await lix.db
  .selectFrom("change")
  .where("entity_id", "=", "user.email")
  .where("created_at", ">", Date.now() - 86400000)
  .selectAll()
  .execute();
```

This query-first approach means you can:
- Build custom UIs that show exactly the data you need
- Create automation that reacts to specific changes
- Integrate change control deeply into your application's logic

## Data Flow Example

Here's what happens when you update a file:

```
1. Plugin detects changes
   ↓
2. Creates change records for modified entities
   ↓
3. Inserts new state records with updated values
   ↓
4. Preserves old state records for history
   ↓
5. Your app queries current or historical state
```

The key insight: **Nothing is ever deleted**. Every change creates new records while preserving the old ones. This is how Lix provides complete history, undo/redo, and time travel.

## Core Mental Model

Think of Lix as three layers:

1. **Storage layer** - SQLite database with all state and change records
2. **Plugin layer** - File format handlers that parse/serialize entities
3. **Query layer** - SQL API to access current state, history, diffs, etc.

You interact primarily with the query layer, using standard SQL to:
- Read current data
- Query history
- Compare versions
- Track changes

## What Makes Lix Different

**vs Git:**
- Lix works with any file format (not just text)
- Entity-level tracking (not line-based)
- Embedded in your app (not a separate tool)
- SQL queries (not CLI commands)

**vs Traditional databases:**
- Full change history (not just current state)
- Branching/versioning (like Git)
- Change proposals and approval workflows
- Works offline in the browser

## Next Steps

Now that you understand how Lix works, you can:

- Learn about the [Data Model](/docs/data-model) (entities, schemas, and how they relate)
- Explore [Architecture](/docs/architecture) for implementation details
- Try the [Change Control](/docs/versions) features to see what you can build
