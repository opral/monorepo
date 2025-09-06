# Labels

Labels in Lix provide a flexible way to categorize and organize changes, change sets, files, and versions. They work similar to tags in other systems, allowing you to add contextual metadata to various entities in your Lix database.

## What are Labels?

Labels are key-value pairs attached to various entities in Lix:

- A label has a `key` (the category or type of label)
- A label has a `value` (the specific tag within that category)
- Labels can be attached to change sets, files, versions, and other entities

For example:

- `{ key: "priority", value: "high" }`
- `{ key: "author", value: "team-member" }`
- `{ key: "status", value: "review-needed" }`

## Using Labels

Labels serve multiple purposes in Lix:

1. **Categorization**: Group related changes or files
2. **Filtering**: Query for specific types of changes
3. **Workflow Management**: Track status or progress
4. **Organization**: Structure your change history

## Label Tables

Lix provides separate tables for different label types:

- `change_set_label` - Labels for change sets
- `file_label` - Labels for files
- `version_label` - Labels for versions

Each label table follows a similar structure:

```typescript
interface Label {
  id: string; // Unique identifier
  entity_id: string; // Reference to the labeled entity
  key: string; // The label key/category
  value: string; // The label value/tag
  created_at: string; // When the label was created
}
```

## Adding Labels

You can add labels when creating entities or update them later:

```typescript
import { createChangeSet } from "@lix-js/sdk";

// Add labels when creating a change set
const changeSet = await createChangeSet({
  lix,
  labels: [
    { key: "type", value: "feature" },
    { key: "priority", value: "high" },
  ],
});

// Add a label to a file
await lix.db
  .insertInto("file_label")
  .values({
    id: generateId(),
    entity_id: fileId,
    key: "status",
    value: "approved",
    created_at: new Date().toISOString(),
  })
  .execute();
```

## Querying with Labels

Labels are especially powerful for filtering and querying:

```typescript
// Find all high-priority change sets
const highPriorityChangeSets = await lix.db
  .selectFrom("change_set")
  .innerJoin("change_set_label", "change_set.id", "change_set_label.entity_id")
  .where("change_set_label.key", "=", "priority")
  .where("change_set_label.value", "=", "high")
  .selectAll("change_set")
  .execute();

// Find all files with a specific status
const approvedFiles = await lix.db
  .selectFrom("file")
  .innerJoin("file_label", "file.id", "file_label.entity_id")
  .where("file_label.key", "=", "status")
  .where("file_label.value", "=", "approved")
  .selectAll("file")
  .execute();
```

## Common Label Types

While you can create any label types that make sense for your application, here are some common patterns:

### Change Set Labels

- `type`: "feature", "bugfix", "refactor", "docs"
- `priority`: "low", "medium", "high", "critical"
- `status`: "in-progress", "review", "approved", "rejected"
- `checkpoint`: "true" (for marking significant points)

### File Labels

- `status`: "draft", "review", "final"
- `category`: "config", "data", "documentation"
- `visibility`: "public", "internal", "private"

### Version Labels

- `stage`: "alpha", "beta", "release-candidate", "stable"
- `release`: "v1.0", "v1.1", "v2.0"
- `lifecycle`: "active", "deprecated", "archived"

## Special Label Uses

Some labels have special meaning in Lix:

### Checkpoint Labels

When a change set has a label with `key: "checkpoint"`, it's treated as a significant point in the change history. This is used by the `createCheckpoint()` function:

```typescript
import { createCheckpoint } from "@lix-js/sdk";

// Create a checkpoint (which adds a special checkpoint label)
const checkpoint = await createCheckpoint({
  lix,
  name: "Feature Complete",
  description: "Completed implementation of feature X",
});
```

The checkpoint function automatically adds a label with `key: "checkpoint"` and `value: "true"` to the change set.

## Example: Workflow with Labels

Here's an example of using labels to implement a simple workflow:

```typescript
// Initialize a feature branch with labels
const featureChangeSet = await createChangeSet({
  lix,
  labels: [
    { key: "type", value: "feature" },
    { key: "status", value: "in-progress" },
    { key: "feature", value: "user-authentication" },
  ],
});

// Update status label when ready for review
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "review",
  })
  .where("entity_id", "=", featureChangeSet.id)
  .where("key", "=", "status")
  .execute();

// Create checkpoint when approved
const approvedCheckpoint = await createCheckpoint({
  lix,
  name: "Feature Approved",
  description: "User authentication feature approved",
  labels: [
    { key: "status", value: "approved" },
    { key: "reviewed-by", value: "team-lead" },
  ],
});
```

## Next Steps

Now that you understand labels, learn more about related concepts:

- [Change Sets](./change-sets) - Collections of related changes that can be labeled
- [Versions](./versions) - Named branches that can use labels
- [Change Graph](./change-graph) - How changes relate to each other
