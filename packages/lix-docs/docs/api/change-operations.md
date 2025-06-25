# Change Operations

The Change Operations API provides functions for creating, managing, and querying changes in the Lix system. These operations are fundamental to Lix's change control capabilities, allowing you to track modifications at a granular level.

## Working with Changes

### `createChange()`

Creates a new change record in the database, representing a specific modification to a file.

```typescript
import { createChange } from "@lix-js/sdk";

async function recordChange(lix, fileId, entityId, pluginKey) {
  const change = await createChange({
    lix,
    entity_id: entityId, 
    schema_key: "cell", // Schema depends on the file type
    schema_version: "1.0",
    file_id: fileId,
    plugin_key: pluginKey,
    snapshot: { /* snapshot data */ },
    authors: ["user1@example.com"]
  });
  
  console.log("Created change:", change.id);
  return change;
}
```

**Parameters**:
- `options: CreateChangeOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `id?: string` - Optional custom ID for the change
  - `entity_id: string` - Identifier for the entity being changed
  - `schema_key: string` - The schema type for this change
  - `schema_version: string` - Version of the schema
  - `file_id: string` - ID of the file being changed
  - `plugin_key: string` - Key of the plugin handling this file type
  - `snapshot: object` - Data snapshot for this change
  - `authors?: string[]` - Optional array of author identifiers

**Returns**: `Promise<Change>` - The created change object

**Source Code**: [createChange](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change/create-change.ts)

---

## Working with Change Sets

Change sets are collections of related changes that form nodes in the change graph.

### `createChangeSet()`

Creates a new change set, optionally with parent change sets to form a graph structure.

```typescript
import { createChangeSet } from "@lix-js/sdk";

async function createNewChangeSet(lix, parentId = null) {
  // Create a change set, optionally with a parent
  const changeSet = await createChangeSet({
    lix,
    // If there's a parent, specify it
    ...(parentId ? { parents: [{ id: parentId }] } : {}),
    // Optional elements (changes) to include
    elements: [{ id: "change1" }, { id: "change2" }],
    // Optional labels to categorize this change set
    labels: [{ key: "type", value: "feature" }]
  });
  
  console.log("Created change set:", changeSet.id);
  return changeSet;
}
```

**Parameters**:
- `options: CreateChangeSetOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `id?: string` - Optional custom ID for the change set
  - `elements?: Array<{ id: string }>` - Optional array of changes to include
  - `labels?: Array<{ key: string, value: string }>` - Optional labels
  - `parents?: Array<{ id: string }>` - Optional parent change sets
  - `lixcol_version_id?: string` - Optional version ID

**Returns**: `Promise<ChangeSet & { lixcol_version_id: string }>` - The created change set

**Source Code**: [createChangeSet](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-change-set.ts)

---

### `applyChangeSet()`

Applies a change set to update the current state of the database.

```typescript
import { applyChangeSet } from "@lix-js/sdk";

async function applyChanges(lix, changeSet) {
  // Apply the change set to update the current state
  await applyChangeSet({
    lix,
    changeSet
  });
  
  console.log("Applied change set:", changeSet.id);
}
```

**Parameters**:
- `options: ApplyChangeSetOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `changeSet: ChangeSet` - The change set to apply

**Returns**: `Promise<void>`

**Source Code**: [applyChangeSet](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/apply-change-set.ts)

---

### `createCheckpoint()`

Creates a checkpoint, which is a special type of change set that marks a significant state in the change history.

```typescript
import { createCheckpoint } from "@lix-js/sdk";

async function saveCheckpoint(lix) {
  const checkpoint = await createCheckpoint({
    lix,
    name: "Feature Complete",
    description: "Completed implementation of feature X",
    labels: [
      { key: "milestone", value: "v1.0" },
      { key: "author", value: "team-member" }
    ]
  });
  
  console.log("Created checkpoint:", checkpoint.id);
  return checkpoint;
}
```

**Parameters**:
- `options: CreateCheckpointOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `name?: string` - Optional name for the checkpoint
  - `description?: string` - Optional description
  - `labels?: Array<{ key: string, value: string }>` - Optional labels

**Returns**: `Promise<ChangeSet & { lixcol_version_id: string }>` - The created checkpoint

**Source Code**: [createCheckpoint](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-checkpoint.ts)

## Querying Changes and Change Sets

### Querying Individual Changes

You can query changes using SQL through Lix's database interface:

```typescript
// Get all changes for a specific file
const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", fileId)
  .selectAll()
  .execute();

// Get changes by author
const userChanges = await lix.db
  .selectFrom("change")
  .whereExists(qb => 
    qb.selectFrom("change_author")
      .whereRef("change_author.change_id", "=", "change.id")
      .where("change_author.author", "=", "user@example.com")
  )
  .selectAll()
  .execute();
```

### Querying Change Sets

You can also query change sets and their relationships:

```typescript
// Get all change sets
const changeSets = await lix.db
  .selectFrom("change_set")
  .selectAll()
  .execute();

// Get change sets with specific labels
const featureChangeSets = await lix.db
  .selectFrom("change_set")
  .whereExists(qb => 
    qb.selectFrom("change_set_label")
      .whereRef("change_set_label.change_set_id", "=", "change_set.id")
      .where("change_set_label.key", "=", "type")
      .where("change_set_label.value", "=", "feature")
  )
  .selectAll()
  .execute();

// Get the parent-child relationships
const edges = await lix.db
  .selectFrom("change_set_edge")
  .selectAll()
  .execute();
```

## Advanced Change Operations

### Graph Traversal

Lix provides helper functions for traversing the change graph:

```typescript
import { changeSetIsAncestorOf, changeSetIsDescendantOf } from "@lix-js/sdk";

// Check if one change set is an ancestor of another
const isAncestor = await lix.db
  .selectFrom("change_set")
  .where(changeSetIsAncestorOf(ancestorId, descendantId))
  .executeTakeFirst();

// Check if one change set is a descendant of another
const isDescendant = await lix.db
  .selectFrom("change_set")
  .where(changeSetIsDescendantOf(descendantId, ancestorId))
  .executeTakeFirst();
```

### Merging Branches

You can merge different branches of development:

```typescript
import { createMergeChangeSet } from "@lix-js/sdk";

async function mergeBranches(lix, branchAId, branchBId) {
  // Create a merge change set that combines two branches
  const mergeChangeSet = await createMergeChangeSet({
    lix,
    sources: [
      { id: branchAId },
      { id: branchBId }
    ]
  });
  
  console.log("Created merge change set:", mergeChangeSet.id);
  return mergeChangeSet;
}
```

## Example: Working with Change History

Here's a complete example of creating a file and tracking its changes:

```typescript
import { 
  openLixInMemory, 
  newLixFile, 
  handleFileInsert, 
  handleFileUpdate,
  createChangeSet,
  createCheckpoint
} from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function manageDocumentChanges() {
  // Create and open a new Lix file
  const lixFile = await newLixFile();
  const lix = await openLixInMemory({
    blob: lixFile,
    providePlugins: [jsonPlugin]
  });
  
  // Create initial document
  await handleFileInsert({
    lix,
    file: {
      path: "/document.json",
      data: new TextEncoder().encode(JSON.stringify({ title: "Draft", content: "Initial content" }))
    }
  });
  
  // Create a checkpoint for the initial version
  await createCheckpoint({
    lix,
    name: "Initial Draft",
    description: "First version of the document"
  });
  
  // Make an update to the document
  await handleFileUpdate({
    lix,
    file: {
      path: "/document.json",
      data: new TextEncoder().encode(JSON.stringify({ 
        title: "Draft", 
        content: "Updated content with more details" 
      }))
    }
  });
  
  // Create another checkpoint
  await createCheckpoint({
    lix,
    name: "Content Update",
    description: "Added more details to the content"
  });
  
  // Query the change history
  const history = await lix.db
    .selectFrom("change_set")
    .leftJoin("change_set_label", "change_set.id", "change_set_label.change_set_id")
    .where("change_set_label.key", "=", "checkpoint")
    .select([
      "change_set.id",
      "change_set.created_at",
      "change_set_label.value as name"
    ])
    .orderBy("change_set.created_at", "asc")
    .execute();
  
  console.log("Document change history:", history);
}
```

## Next Steps

With the Change Operations API, you can track and manage changes in your Lix application. To learn more about related functionality:

- [File Operations](./file-operations) - Work with files in Lix
- [Version Operations](./version-operations) - Manage different versions
- [Database Schema](./schema) - Understand the underlying data model