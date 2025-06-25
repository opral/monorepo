# Snapshots

Snapshots in Lix are an essential part of the change tracking system. They capture the state of content at specific points in time, allowing for precise change detection and history tracking.

## What is a Snapshot?

A snapshot in Lix is a record of the content (state) of an entity at a specific moment. Think of it like taking a photograph of your data at a particular point in time. Each snapshot:

- Has a unique identifier
- Contains the exact content of an entity
- Is immutable (never changes once created)
- Is linked to one or more changes

Snapshots enable Lix to understand exactly what changed between different states of your data.

## How Snapshots Work

Snapshots are implemented using content-addressing. This means:

1. When content is captured in a snapshot, its JSON representation is normalized (sorted)
2. A SHA-256 hash is calculated from this normalized content
3. This hash becomes part of the snapshot's identifier
4. Identical content produces identical snapshot IDs (deduplication)

This approach ensures efficient storage and retrieval of snapshots.

## Creating Snapshots

Snapshots are typically created automatically when changes are detected, but you can also create them manually using the `createSnapshot` function:

```typescript
import { createSnapshot } from "@lix-js/sdk";

// Create a snapshot with some content
const snapshot = await createSnapshot({
  lix,
  content: {
    title: "My Document",
    version: "1.0.0",
    sections: ["Introduction", "Main", "Conclusion"]
  }
});

console.log("Created snapshot:", snapshot.id);
```

The content is stored as a JSON object in the database, allowing for efficient querying and retrieval.

## Snapshots and Changes

Snapshots and changes work together to track modifications to your data:

1. A change represents a specific modification (add, update, remove)
2. The change references two snapshots:
   - The snapshot before the change (via `from_value`)
   - The snapshot after the change (via `to_value`)

This relationship allows Lix to precisely track what changed and reconstruct data states at any point in history.

```typescript
// Example of a change with associated snapshots
const change = {
  id: "change_123",
  file_id: "file_456",
  snapshot_id: "snapshot_789", // Points to the snapshot containing this change
  created_at: "2023-06-23T12:34:56Z",
  entity_type: "document",
  entity_id: "doc_001",
  operation: "update",
  path: ["title"],
  from_value: "Draft Document", // Previous value
  to_value: "Final Document"    // New value
};
```

## Querying Snapshots

You can query snapshots directly from the Lix database:

```typescript
// Get all snapshots for a specific file
const snapshots = await lix.db
  .selectFrom("snapshot")
  .innerJoin("change", "change.snapshot_id", "snapshot.id")
  .where("change.file_id", "=", fileId)
  .selectAll()
  .execute();

// Get a specific snapshot by ID
const snapshot = await lix.db
  .selectFrom("snapshot")
  .where("id", "=", snapshotId)
  .selectAll()
  .executeTakeFirstOrThrow();
```

## Benefits of Snapshots

Snapshots provide several key benefits in the Lix architecture:

1. **Immutability**: Once created, snapshots never change, providing a reliable history
2. **Deduplication**: Identical content is stored only once, saving storage space
3. **Deterministic IDs**: The same content always produces the same snapshot ID
4. **Efficient Queries**: Content addressing makes finding specific states efficient
5. **Precise Change Tracking**: By comparing snapshots, Lix can determine exactly what changed

## Implementation Details

The snapshot system in Lix is implemented in the [`create-snapshot.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/snapshot/create-snapshot.ts) file. It uses the SQLite database with JSON support to store and retrieve snapshot data efficiently.

```typescript
// From create-snapshot.ts
export async function createSnapshot({
  lix,
  content,
}: {
  lix: Lix;
  content: JSONType;
}): Promise<LixSnapshot> {
  // Generate a content hash for deduplication
  const id = jsonSha256(content);

  // Check if this snapshot already exists
  const existingSnapshot = await lix.db
    .selectFrom("snapshot")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();

  if (existingSnapshot) {
    return existingSnapshot;
  }

  // Create a new snapshot
  return await lix.db
    .insertInto("snapshot")
    .values({
      id,
      content,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
```

## Next Steps

Now that you understand snapshots, learn more about how they fit into the broader change tracking system:

- [Change Graph](./change-graph) - How changes relate to each other in a graph structure
- [Versions](./versions) - How different states of data are managed
- [Changes](./changes) - The core concept of tracking modifications