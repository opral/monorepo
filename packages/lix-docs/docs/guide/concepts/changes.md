# Changes

Changes are at the heart of the Lix SDK. They represent the modifications made to files and provide the foundation for Lix's change control capabilities.

## What is a Change?

In Lix, a change represents a specific modification to a file. Unlike traditional version control systems that track changes at the file level, Lix understands the semantics of what changed within a file. For example:

- In a JSON file, a change might be updating a specific property value
- In a CSV file, a change might be modifying a cell in a specific row and column
- In a markdown file, a change might be updating a specific paragraph or heading

Each change is associated with:
- The file that was modified
- A snapshot of the file's state
- Metadata about the change (time, author, etc.)

## Change Detection

When you update a file in Lix, the system automatically detects what changed by:

1. Using file-specific plugins to understand the file's structure
2. Comparing the previous version with the new version
3. Identifying specific elements that were added, removed, or modified

This granular change detection is what allows Lix to provide powerful change control features like:
- Precise conflict detection
- Intelligent merging
- Detailed change history
- Targeted change proposals

## Change Schema

The core change entity has the following structure:

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

- `id`: Unique identifier for the change
- `file_id`: Reference to the file that was changed
- `snapshot_id`: Reference to the snapshot this change is part of
- `created_at`: Timestamp when the change was created
- `entity_type`: The type of entity that was changed (depends on the file format)
- `entity_id`: Identifier for the specific entity within the file
- `operation`: The type of operation (add, update, remove)
- `path`: Path to the changed element within the entity
- `from_value`: Previous value (null for adds)
- `to_value`: New value (null for removes)

## Querying Changes

You can query changes using SQL through Lix's database interface:

```javascript
// Get all changes for a specific file
const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", fileId)
  .execute();

// Get changes in a specific version
import { changeInVersion } from "@lix-js/sdk";

const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", fileId)
  .where(changeInVersion(versionId))
  .execute();
```

## Next Steps

Now that you understand changes, explore related concepts:

- [Snapshots](./snapshots) - Learn how changes are grouped together
- [Change Graph](./change-graph) - Understand how changes relate to each other
- [Versions](./versions) - See how changes are organized into different versions