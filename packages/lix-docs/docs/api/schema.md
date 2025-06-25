# Database Schema

Lix uses a relational database schema to store files, changes, versions, and other entities. Understanding this schema is essential for advanced use cases where you need to perform custom queries or work directly with the database.

## Overview

The Lix database schema is designed around these core concepts:

1. **Files** - The files being tracked
2. **Changes** - Individual modifications to files
3. **Change Sets** - Collections of related changes
4. **Versions** - Named references to specific states
5. **Snapshots** - Immutable records of content state

## Schema Diagram

Here's a simplified view of the key relationships in the Lix database schema:

```
+-------------+       +------------+       +------------+
|   version   |------>| change_set |<----->|   change   |
+-------------+       +------------+       +------------+
                           |                     |
                           v                     v
                    +--------------+      +------------+
                    | change_set_  |      |    file    |
                    |    edge      |      +------------+
                    +--------------+
```

## Core Tables

### File Table

The `file` table stores information about files in the Lix system.

```typescript
interface File {
  id: string;
  path: string;
  data: Uint8Array;
  created_at: string;
  updated_at: string;
}
```

- `id` - Unique identifier for the file
- `path` - File path (used as a logical identifier)
- `data` - Binary content of the file
- `created_at` - Timestamp when the file was created
- `updated_at` - Timestamp when the file was last updated

### Change Table

The `change` table stores individual modifications to files.

```typescript
interface Change {
  id: string;
  file_id: string;
  snapshot_id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  operation: "add" | "update" | "remove";
  path: string[];
  from_value: unknown;
  to_value: unknown;
}
```

- `id` - Unique identifier for the change
- `file_id` - Reference to the file that was changed
- `snapshot_id` - Reference to the snapshot this change is part of
- `created_at` - Timestamp when the change was created
- `entity_type` - The type of entity that was changed
- `entity_id` - Identifier for the specific entity
- `operation` - The type of operation (add, update, remove)
- `path` - Path to the changed element within the entity
- `from_value` - Previous value (null for adds)
- `to_value` - New value (null for removes)

### Change Set Table

The `change_set` table represents collections of related changes.

```typescript
interface ChangeSet {
  id: string;
  created_at: string;
}
```

- `id` - Unique identifier for the change set
- `created_at` - Timestamp when the change set was created

### Change Set Edge Table

The `change_set_edge` table defines the relationships between change sets, forming a directed acyclic graph.

```typescript
interface ChangeSetEdge {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
}
```

- `id` - Unique identifier for the edge
- `parent_id` - Reference to the parent change set
- `child_id` - Reference to the child change set
- `created_at` - Timestamp when the edge was created

### Change Set Element Table

The `change_set_element` table associates changes with change sets.

```typescript
interface ChangeSetElement {
  id: string;
  change_set_id: string;
  change_id: string;
  created_at: string;
}
```

- `id` - Unique identifier for the element
- `change_set_id` - Reference to the change set
- `change_id` - Reference to the change
- `created_at` - Timestamp when the element was created

### Version Table

The `version` table stores named references to specific change sets.

```typescript
interface Version {
  id: string;
  name: string;
  change_set_id: string;
  inherits_from_version_id: string | null;
  created_at: string;
}
```

- `id` - Unique identifier for the version
- `name` - Human-readable name for the version
- `change_set_id` - Reference to the change set this version points to
- `inherits_from_version_id` - Optional reference to a parent version
- `created_at` - Timestamp when the version was created

### Snapshot Table

The `snapshot` table stores immutable records of content state.

```typescript
interface Snapshot {
  id: string;
  file_id: string;
  created_at: string;
  data: Uint8Array;
}
```

- `id` - Unique identifier for the snapshot
- `file_id` - Reference to the file this snapshot belongs to
- `created_at` - Timestamp when the snapshot was created
- `data` - Binary content of the file at this snapshot point

## Additional Tables

### Label Tables

Lix provides tables for labeling various entities:

- `change_set_label` - Labels for change sets
- `file_label` - Labels for files
- `version_label` - Labels for versions

These label tables follow a common structure:

```typescript
interface Label {
  id: string;
  entity_id: string; // References the labeled entity
  key: string;
  value: string;
  created_at: string;
}
```

### Thread and Comment Tables

For collaboration features, Lix includes tables for discussions:

- `thread` - Discussion threads
- `comment` - Individual comments within threads

## Working with the Schema

You can access the database schema through the Kysely interface:

```typescript
import { openLix } from "@lix-js/sdk";

async function exploreSchema(filepath) {
  const lix = await openLix({
    filepath,
    providePlugins: [/* your plugins */]
  });
  
  // Access the Kysely database instance
  const db = lix.db;
  
  // Query the schema
  const files = await db
    .selectFrom("file")
    .selectAll()
    .execute();
  
  const changes = await db
    .selectFrom("change")
    .selectAll()
    .execute();
  
  const versions = await db
    .selectFrom("version")
    .selectAll()
    .execute();
  
  console.log(`Found ${files.length} files, ${changes.length} changes, and ${versions.length} versions`);
}
```

## Schema Types

The TypeScript interface for the database schema is defined as:

```typescript
interface LixDatabaseSchema {
  file: File;
  change: Change;
  change_author: ChangeAuthor;
  change_set: ChangeSet;
  change_set_edge: ChangeSetEdge;
  change_set_element: ChangeSetElement;
  change_set_label: ChangeSetLabel;
  file_label: FileLabel;
  snapshot: Snapshot;
  thread: Thread;
  comment: Comment;
  version: Version;
  version_label: VersionLabel;
  // ... other tables
}
```

You can use these types for type-safe database operations with Kysely:

```typescript
import { Kysely } from "kysely";
import { LixDatabaseSchema } from "@lix-js/sdk";

// The Lix db property is typed as:
// db: Kysely<LixDatabaseSchema>

// This gives you type safety for all database operations
const files = await lix.db
  .selectFrom("file")
  .select(["id", "path", "created_at"]) // Type-checked field names
  .execute();
```

## Using Raw SQL

For advanced queries, you can use raw SQL through Kysely:

```typescript
// Complex query using SQL
const result = await lix.db
  .executeQuery<{ count: number }>({
    sql: `SELECT COUNT(*) as count FROM change 
          WHERE file_id = ? AND created_at > ?`,
    parameters: [fileId, lastWeekDate.toISOString()]
  });

console.log(`Found ${result.rows[0].count} changes in the last week`);
```

## Schema Migrations

The Lix SDK handles schema migrations automatically when opening a Lix file. If the schema version in the file is older than what the SDK expects, it will upgrade the schema as needed.

## Next Steps

With an understanding of the database schema, you can perform advanced operations with Lix:

- [Core API](./core) - Use the core Lix functions
- [File Operations](./file-operations) - Work with files in Lix
- [Change Operations](./change-operations) - Track and manage changes