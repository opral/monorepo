# Merging

Merging in Lix is the process of combining changes from different branches or development paths. This concept is fundamental to collaborative workflows and parallel development.

## What is Merging?

Merging in Lix involves:

- Combining changes from two or more branches
- Creating a new change set that includes changes from all source branches
- Resolving any conflicts between divergent changes
- Preserving the history of all merged branches

Similar to Git, Lix uses a directed acyclic graph (DAG) to track changes, enabling sophisticated merging capabilities with fine-grained conflict detection.

## The Merge Process

When you merge branches in Lix, the system:

1. Identifies the common ancestor of the branches
2. Determines the changes made in each branch since the common ancestor
3. Combines non-conflicting changes automatically
4. Identifies conflicting changes that need resolution
5. Creates a new merge change set with multiple parents

## Creating Merge Change Sets

Merge operations are performed using the `createMergeChangeSet()` function:

```typescript
import { createMergeChangeSet } from "@lix-js/sdk";

// Merge two branches
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [
    { id: mainBranchChangeSetId },
    { id: featureBranchChangeSetId }
  ]
});

console.log("Created merge change set:", mergeChangeSet.id);
```

The `sources` parameter specifies the change sets to merge. The function returns a new change set that combines changes from all sources.

## Merge Conflict Detection

Lix provides sophisticated conflict detection at the entity level, not just the file level. This means:

- Conflicts are detected at the property/field level
- Changes to different properties in the same file don't conflict
- Only changes to the same property from different branches create conflicts

For example, if branch A changes the `title` of a document and branch B changes the `content` of the same document, these changes don't conflict and can be merged automatically.

## Conflict Resolution

When conflicts are detected during a merge, Lix provides several approaches to resolution:

### Manual Resolution

You can manually resolve conflicts by:

1. Identifying the conflicting changes
2. Choosing which version to keep or creating a new combined version
3. Creating a new change with the resolved content
4. Adding this change to the merge change set

Here's an example of manual conflict resolution:

```typescript
// Identify conflicts
const conflicts = await lix.db
  .selectFrom("change")
  .whereExists(qb => 
    qb.selectFrom("change_set_element")
      .whereRef("change_set_element.change_id", "=", "change.id")
      .where("change_set_element.change_set_id", "=", mergeChangeSetId)
      .where("change_set_element.conflict", "=", true)
  )
  .selectAll()
  .execute();

// For each conflict, create a resolution
for (const conflict of conflicts) {
  // Create a new change with resolved content
  const resolvedChange = await createChange({
    lix,
    entity_id: conflict.entity_id,
    schema_key: conflict.schema_key,
    schema_version: conflict.schema_version,
    file_id: conflict.file_id,
    plugin_key: conflict.plugin_key,
    // Set the resolved value here
    snapshot: { /* resolved data */ }
  });
  
  // Add the resolved change to the merge change set
  await lix.db
    .updateTable("change_set_element")
    .set({
      conflict: false,
      resolution_change_id: resolvedChange.id
    })
    .where("change_set_id", "=", mergeChangeSetId)
    .where("change_id", "=", conflict.id)
    .execute();
}
```

### Automatic Resolution Strategies

For simpler conflicts, you might implement automatic resolution strategies:

1. **Keep Source**: Always prefer changes from a specific branch
2. **Last Writer Wins**: Choose the most recent change based on timestamp
3. **Combine Values**: For certain data types, automatically merge the values

## Merge Examples

### Example: Merging Document Changes

Here's an example of merging changes to a document from different branches:

```typescript
// Start with a common ancestor
await handleFileInsert({
  lix,
  file: {
    path: "/document.json",
    data: new TextEncoder().encode(JSON.stringify({
      title: "Original Title",
      content: "Original content",
      metadata: { author: "User" }
    }))
  }
});

// Create the base change set
const baseChangeSet = await createChangeSet({ lix });

// Create Branch A: modify the title
await handleFileUpdate({
  lix,
  file: {
    path: "/document.json",
    data: new TextEncoder().encode(JSON.stringify({
      title: "Updated Title",
      content: "Original content",
      metadata: { author: "User" }
    }))
  }
});

// Create change set for Branch A
const branchAChangeSet = await createChangeSet({ lix });

// Switch back to the base change set
await switchVersion({
  lix,
  to: baseChangeSet.id
});

// Create Branch B: modify the content
await handleFileUpdate({
  lix,
  file: {
    path: "/document.json",
    data: new TextEncoder().encode(JSON.stringify({
      title: "Original Title",
      content: "Updated content with new information",
      metadata: { author: "User", lastModified: "2023-06-01" }
    }))
  }
});

// Create change set for Branch B
const branchBChangeSet = await createChangeSet({ lix });

// Merge the branches
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [
    { id: branchAChangeSet.id },
    { id: branchBChangeSet.id }
  ]
});

// Apply the merge change set
await applyChangeSet({
  lix,
  changeSet: mergeChangeSet
});

// The document now has changes from both branches:
// - title from Branch A
// - content and metadata from Branch B
```

### Example: Resolving Conflicts

Here's an example that includes conflict resolution:

```typescript
// Start with a common base
await handleFileInsert({
  lix,
  file: {
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify({
      theme: "light",
      language: "en",
      features: ["search", "notifications"]
    }))
  }
});

// Create base change set
const baseChangeSet = await createChangeSet({ lix });

// Branch A: Change theme and add a feature
await handleFileUpdate({
  lix,
  file: {
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify({
      theme: "dark",
      language: "en",
      features: ["search", "notifications", "offline-mode"]
    }))
  }
});

const branchAChangeSet = await createChangeSet({ lix });

// Switch back to base
await switchVersion({
  lix,
  to: baseChangeSet.id
});

// Branch B: Change theme and language
await handleFileUpdate({
  lix,
  file: {
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify({
      theme: "blue",
      language: "fr",
      features: ["search", "notifications"]
    }))
  }
});

const branchBChangeSet = await createChangeSet({ lix });

// Attempt to merge (will detect conflicts on the 'theme' property)
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [
    { id: branchAChangeSet.id },
    { id: branchBChangeSet.id }
  ]
});

// Resolve the conflict manually
const conflicts = await lix.db
  .selectFrom("change")
  .whereExists(qb => 
    qb.selectFrom("change_set_element")
      .whereRef("change_set_element.change_id", "=", "change.id")
      .where("change_set_element.change_set_id", "=", mergeChangeSet.id)
      .where("change_set_element.conflict", "=", true)
  )
  .selectAll()
  .execute();

// Create a resolution (choosing the dark theme)
if (conflicts.length > 0) {
  // Get the current file content
  const file = await lix.db
    .selectFrom("file")
    .where("path", "=", "/config.json")
    .selectAll()
    .executeTakeFirstOrThrow();
  
  // Create a resolved version
  const resolvedData = {
    theme: "dark", // Choose dark theme from Branch A
    language: "fr", // Keep language from Branch B
    features: ["search", "notifications", "offline-mode"] // Keep expanded features from Branch A
  };
  
  // Update the file with the resolved content
  await handleFileUpdate({
    lix,
    file: {
      path: "/config.json",
      data: new TextEncoder().encode(JSON.stringify(resolvedData))
    }
  });
  
  // Create a resolution change set
  const resolutionChangeSet = await createChangeSet({ lix });
  
  // Complete the merge by linking the resolution
  await lix.db
    .updateTable("change_set_edge")
    .set({
      resolution_change_set_id: resolutionChangeSet.id
    })
    .where("child_id", "=", mergeChangeSet.id)
    .execute();
}
```

## Visualizing Merges

Merges create a diamond pattern in the change graph:

```
       D --- E      Feature Branch
      /       \
A --- B --- C --- F  Main Branch
```

In this diagram:
- Branch point is at B
- Feature branch includes changes D and E
- Main branch continues with change C
- F is the merge change set that combines changes from both branches

## Next Steps

Now that you understand merging in Lix, explore these related concepts:

- [Change Graph](./change-graph) - The underlying structure that enables merging
- [Change Sets](./change-sets) - The units being merged
- [Versions](./versions) - Named references that can be merged
- [Change Proposals](./change-proposals) - A formalized way to propose and review changes before merging