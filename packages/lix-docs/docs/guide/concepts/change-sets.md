# Change Sets

Change sets are fundamental building blocks in Lix that represent collections of related changes. They form the nodes in the change graph and provide a structured way to manage modifications to your data.

## What are Change Sets?

A change set in Lix is:

- A collection of related changes grouped together
- A node in the directed acyclic graph (DAG) of changes
- A logical unit that can be applied, reverted, or merged
- Similar to commits in Git, but with more granular change tracking

Change sets capture the state of your data at a specific point in time and track how that state evolves.

## Change Set Structure

Each change set consists of:

1. A unique identifier
2. Optional connections to parent change sets
3. A collection of changes (called elements)
4. Optional labels for categorization
5. Creation timestamp

In the database schema, this is represented by the `change_set` table, with connections to other change sets in the `change_set_edge` table, and its associated changes in the `change_set_element` table.

## Creating Change Sets

You can create change sets using the `createChangeSet()` function:

```typescript
import { createChangeSet } from "@lix-js/sdk";

// Create a change set
const changeSet = await createChangeSet({
  lix,
  // Optionally specify parent change sets
  parents: [{ id: parentChangeSetId }],
  // Optionally include specific changes
  elements: [{ id: changeId1 }, { id: changeId2 }],
  // Optionally add labels
  labels: [{ key: "type", value: "feature" }],
});

console.log("Created change set:", changeSet.id);
```

## Types of Change Sets

Lix supports different types of change sets for various purposes:

### Basic Change Sets

Regular change sets created through `createChangeSet()` function.

### Checkpoints

Special change sets that mark significant points in your change history. Created using the `createCheckpoint()` function:

```typescript
import { createCheckpoint } from "@lix-js/sdk";

const checkpoint = await createCheckpoint({
  lix,
  name: "Version 1.0 Release",
  description: "Stable release with all core features",
});
```

Checkpoints automatically add a label with `key: "checkpoint"` to make them easy to identify.

### Merge Change Sets

Change sets that combine changes from multiple parent change sets. Created using the `createMergeChangeSet()` function:

```typescript
import { createMergeChangeSet } from "@lix-js/sdk";

const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [{ id: branchAChangeSetId }, { id: branchBChangeSetId }],
});
```

Merge change sets handle the combination of changes from different branches, potentially resolving conflicts between them.

## Working with Change Sets

### Applying Change Sets

You can apply a change set to update the current state using the `applyChangeSet()` function:

```typescript
import { applyChangeSet } from "@lix-js/sdk";

await applyChangeSet({
  lix,
  changeSet,
});
```

This updates the current state to reflect the changes in the change set.

### Querying Change Sets

You can query change sets directly through the database interface:

```typescript
// Get all change sets
const changeSets = await lix.db.selectFrom("change_set").selectAll().execute();

// Get change sets with specific labels
const featureChangeSets = await lix.db
  .selectFrom("change_set")
  .innerJoin("change_set_label", "change_set.id", "change_set_label.entity_id")
  .where("change_set_label.key", "=", "type")
  .where("change_set_label.value", "=", "feature")
  .selectAll("change_set")
  .execute();
```

### Analyzing Change Set Relationships

You can explore the relationships between change sets:

```typescript
// Get parent-child relationships
const edges = await lix.db.selectFrom("change_set_edge").selectAll().execute();

// Get the changes in a specific change set
const changes = await lix.db
  .selectFrom("change")
  .innerJoin("change_set_element", "change.id", "change_set_element.change_id")
  .where("change_set_element.change_set_id", "=", changeSetId)
  .selectAll("change")
  .execute();
```

## Change Sets and the Change Graph

Change sets form the nodes in Lix's change graph:

```
A → B → C → D   (main branch)
      ↘
        E → F   (feature branch)
```

Each letter represents a change set, and arrows represent parent-child relationships. This graph structure enables powerful workflows:

1. **Branching**: Create independent lines of development from a common ancestor
2. **Merging**: Combine changes from different branches
3. **History Tracking**: Understand how changes evolved over time

## Example: Document Revision Workflow

Here's an example of using change sets to track document revisions:

```typescript
// Initial document version
await handleFileInsert({
  lix,
  file: {
    path: "/document.md",
    data: new TextEncoder().encode("# Initial Draft"),
  },
});

// Create a change set for the initial version
const initialChangeSet = await createChangeSet({ lix });

// Mark it as a checkpoint
const checkpoint1 = await createCheckpoint({
  lix,
  name: "Initial Draft",
  description: "First version of the document",
});

// Update the document
await handleFileUpdate({
  lix,
  file: {
    path: "/document.md",
    data: new TextEncoder().encode("# Revised Draft\n\nAdded content."),
  },
});

// Create another change set for the revision
const revisionChangeSet = await createChangeSet({ lix });

// Mark it as another checkpoint
const checkpoint2 = await createCheckpoint({
  lix,
  name: "Revision 1",
  description: "First revision with additional content",
});

// Query the change history
const history = await lix.db
  .selectFrom("change_set")
  .leftJoin(
    "change_set_label",
    "change_set.id",
    "change_set_label.change_set_id",
  )
  .where("change_set_label.key", "=", "checkpoint")
  .select([
    "change_set.id",
    "change_set.created_at",
    "change_set_label.value as name",
  ])
  .orderBy("change_set.created_at", "asc")
  .execute();
```

## Next Steps

Now that you understand change sets, explore these related concepts:

- [Change Graph](./change-graph) - How change sets connect to form a graph
- [Versions](./versions) - Named references to specific change sets
- [Merging](./merging) - How to combine changes from different branches
- [Labels](./labels) - How to categorize and organize change sets
