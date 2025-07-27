# Change Graph

The change graph is a fundamental concept in Lix that represents the relationships between changes. It provides the foundation for version control capabilities like branching and merging.

## What is a Change Graph?

A change graph in Lix is a directed acyclic graph (DAG) where:

- Each node represents a change set (a collection of related changes)
- Edges represent parent-child relationships between change sets
- The direction of edges shows how changes evolved over time

This graph structure is similar to how Git manages commits, allowing for powerful branching and merging capabilities.

## Change Sets and the Graph

Change sets are the building blocks of the change graph:

1. A change set is a collection of related changes
2. Each change set has a unique ID
3. Change sets can have one or more parent change sets
4. The connections between change sets form the graph structure

Here's a simple representation of a change graph:

```
A → B → C → D   (main branch)
      ↘
        E → F   (feature branch)
```

In this diagram:

- Each letter represents a change set
- Arrows represent parent-child relationships
- The graph shows two branches of development

## Creating Change Sets

Change sets are created using the `createChangeSet` function:

```typescript
import { createChangeSet } from "@lix-js/sdk";

// Create a change set with a parent
const changeSet = await createChangeSet({
  lix,
  parent: { id: parentChangeSetId },
});

console.log("Created change set:", changeSet.id);
```

This adds a new node to the change graph, connected to its parent.

## Traversing the Graph

You can traverse the change graph to find relationships between change sets:

```typescript
import { changeSetIsAncestorOf } from "@lix-js/sdk";

// Check if one change set is an ancestor of another
const isAncestor = await lix.db
  .selectFrom("change_set_element")
  .where(changeSetIsAncestorOf(ancestorId, descendantId))
  .executeTakeFirst();

if (isAncestor) {
  console.log(`Change set ${ancestorId} is an ancestor of ${descendantId}`);
}
```

The Lix SDK provides several helpers for graph traversal:

- `changeSetIsAncestorOf()` - Checks if one change set is an ancestor of another
- `changeSetIsDescendantOf()` - Checks if one change set is a descendant of another
- `changeSetElementInSymmetricDifference()` - Finds elements unique to each branch

## Merging Branches

One of the most powerful operations on the change graph is merging branches:

```typescript
import { createMergeChangeSet } from "@lix-js/sdk";

// Merge two branches
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [{ id: branchAChangeSetId }, { id: branchBChangeSetId }],
});

console.log("Created merge change set:", mergeChangeSet.id);
```

When you merge branches, Lix:

1. Creates a new change set that has multiple parents
2. Identifies and resolves any conflicts between the branches
3. Combines changes from both branches into a unified state

## Visualizing the Graph

The change graph can be visualized to help understand the relationships between changes:

```typescript
// Example code from ChangeGraph.tsx
import dagre from "dagre";

// Create a new graph
const g = new dagre.graphlib.Graph();
g.setGraph({ rankdir: "LR" });
g.setDefaultEdgeLabel(() => ({}));

// Add nodes for each change set
changeSets.forEach((changeSet) => {
  g.setNode(changeSet.id, {
    label: changeSet.id,
    width: 150,
    height: 30,
  });
});

// Add edges for parent-child relationships
edges.forEach((edge) => {
  g.setEdge(edge.parent_id, edge.child_id);
});

// Layout the graph
dagre.layout(g);
```

This produces a visual representation of the change graph, making it easier to understand complex branching structures.

## Graph Use Cases

The change graph enables several powerful capabilities in Lix:

1. **Branching**: Create independent lines of development
2. **Merging**: Combine changes from different branches
3. **History Tracking**: Understand how changes evolved over time
4. **Conflict Resolution**: Identify and resolve conflicting changes
5. **Collaboration**: Enable multiple users to work independently

## Implementation Details

The change graph is implemented through several key files in the Lix SDK:

- [`create-change-set.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-change-set.ts) - Creates nodes in the graph
- [`create-merge-change-set.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-merge-change-set.ts) - Merges branches in the graph
- [`change-set-is-ancestor-of.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/query-filter/change-set-is-ancestor-of.ts) - Traverses the graph

The underlying data model uses several tables:

- `change_set` - Stores the nodes
- `change_set_edge` - Stores the edges (connections)
- `change_set_element` - Associates changes with change sets

## Example: Tracking Document Revisions

Here's an example of using the change graph to track document revisions:

```typescript
// Create initial document
const initialChangeSet = await createChangeSet({ lix });
await lix.db
  .insertInto("file")
  .values({
    path: "/document.md",
    data: new TextEncoder().encode("# Initial Draft"),
  })
  .execute();

// Create a branch for review
const reviewChangeSet = await createChangeSet({
  lix,
  parent: { id: initialChangeSet.id },
});

// Make changes in the review branch
await switchChangeSet({ lix, to: reviewChangeSet });
await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode("# Revised Draft\n\nAdded content."),
  })
  .where("path", "=", "/document.md")
  .execute();

// Make different changes in the main branch
await switchChangeSet({ lix, to: initialChangeSet });
await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode("# Initial Draft\n\nFixed typo."),
  })
  .where("path", "=", "/document.md")
  .execute();

// Merge the branches
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [{ id: initialChangeSet.id }, { id: reviewChangeSet.id }],
});
```

This example shows how the change graph enables parallel development and merging of different document versions.

## Next Steps

Now that you understand the change graph, learn more about related concepts:

- [Versions](./versions) - How named branches are managed
- [Changes](./changes) - The individual modifications tracked in the graph
- [Snapshots](./snapshots) - How content states are captured at specific points
