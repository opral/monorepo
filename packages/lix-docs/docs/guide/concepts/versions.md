# Versions

Versions in Lix provide a way to create and manage different states of your data, similar to branches in Git. They allow for parallel development and experimentation while maintaining a clear history of changes.

## What is a Version?

A version in Lix is a named reference to a specific state in the change history. Key properties of versions include:

- A unique identifier
- A human-readable name
- A reference to a change set that represents the version's state
- A reference to a working change set for ongoing changes
- Optional inheritance from another version

Versions act as entry points into the change graph, allowing you to work with different states of your data independently.

## Version Structure

The version structure in Lix consists of several key components:

```typescript
interface Version {
  id: string;
  name: string;
  change_set_id: string;
  working_change_set_id: string;
  inherits_from_version_id: string | null;
  created_at: string;
  updated_at: string;
}
```

- `id`: Unique identifier for the version
- `name`: Human-readable name (e.g., "main", "feature-x")
- `change_set_id`: Points to the base state of the version
- `working_change_set_id`: Points to the change set for ongoing changes
- `inherits_from_version_id`: Establishes inheritance hierarchy

## Creating Versions

You can create a new version using the `createVersion` function:

```typescript
import { createVersion } from "@lix-js/sdk";

// Create a new version based on the current state
const newVersion = await createVersion({
  lix,
  name: "feature-branch", // Optional name (human-readable identifier)
  // You can specify a change set to start from (defaults to current version)
  changeSet: { id: currentVersion.change_set_id }
});

console.log("Created version:", newVersion.name, newVersion.id);
```

By default, a new version inherits from the global version and gets a human-readable name generated using the `humanId` function.

## Switching Between Versions

You can switch between versions using the `switchVersion` function:

```typescript
import { switchVersion } from "@lix-js/sdk";

// Switch to a different version
await switchVersion({
  lix,
  to: newVersion
});

console.log("Switched to version:", newVersion.name);
```

When you switch versions, Lix updates the active version in the database, changing the view of data you see. This is similar to checking out a different branch in Git.

## Version Hierarchy

Versions in Lix can form a hierarchy through inheritance:

```
Global Version
    ↓
  Main Version
   ↙     ↘
Feature A   Feature B
```

This hierarchy affects how data is inherited between versions:

1. Changes made in a parent version can be visible in child versions
2. Changes made in a child version don't affect the parent version
3. Inheritance can be multiple levels deep

## Working with Files in Different Versions

When you switch versions, the files you see reflect the state of that version:

```typescript
// In version A
await switchVersion({ lix, to: versionA });
await lix.db.updateTable("file")
  .set({
    data: new TextEncoder().encode("Version A content"),
  })
  .where("path", "=", "/example.txt")
  .execute();

// Switch to version B
await switchVersion({ lix, to: versionB });
const fileB = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.txt")
  .selectAll()
  .executeTakeFirst();

// The content will be different or might not exist in version B
```

This allows for isolated development environments where changes in one version don't affect others.

## Merging Versions

You can merge changes from one version into another using change sets:

```typescript
import { createMergeChangeSet, switchVersion } from "@lix-js/sdk";

// Create a merge change set combining changes from both versions
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [
    { id: versionA.working_change_set_id },
    { id: versionB.working_change_set_id }
  ]
});

// Update version A's working change set to include the merged changes
await lix.db
  .updateTable("version")
  .set({
    working_change_set_id: mergeChangeSet.id
  })
  .where("id", "=", versionA.id)
  .execute();

// Switch to the updated version A
await switchVersion({ lix, to: { id: versionA.id } });
```

This process combines changes from different development streams, similar to merging branches in Git.

## Version Implementation

Versions in Lix are implemented in several key files:

- [`create-version.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/create-version.ts) - Creates new versions
- [`switch-version.ts`](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/switch-version.ts) - Switches between versions

The version system builds on top of the change graph, providing named references to specific points in the graph.

## Example: Creating a Feature Branch

Here's an example of using versions to implement a feature branch workflow:

```typescript
// Start with main version
const mainVersion = await createVersion({
  lix,
  name: "main"
});
await switchVersion({ lix, to: mainVersion });

// Create initial content
await lix.db.insertInto("file").values({
  path: "/app.json",
  data: new TextEncoder().encode(JSON.stringify({
    name: "My App",
    version: "1.0.0",
    features: ["login"]
  })),
}).execute();

// Create a feature branch
const featureVersion = await createVersion({
  lix,
  name: "feature-notifications",
  // Base this version on main
  changeSet: { id: mainVersion.working_change_set_id }
});

// Switch to feature branch and make changes
await switchVersion({ lix, to: featureVersion });
await lix.db.updateTable("file")
  .set({
    data: new TextEncoder().encode(JSON.stringify({
      name: "My App",
      version: "1.0.0",
      features: ["login", "notifications"]
    })),
  })
  .where("path", "=", "/app.json")
  .execute();

// Switch back to main - it won't have the new feature
await switchVersion({ lix, to: mainVersion });
const mainFile = await lix.db
  .selectFrom("file")
  .where("path", "=", "/app.json")
  .selectAll()
  .executeTakeFirstOrThrow();

// mainFile still has only the "login" feature
```

This example demonstrates how versions allow for isolated development and experimentation.

## Practical Uses for Versions

Versions in Lix enable several powerful workflows:

1. **Feature Development**: Create isolated environments for new features
2. **Collaboration**: Enable multiple users to work independently
3. **Experimentation**: Try different approaches without affecting the main version
4. **Staging**: Create versions for testing before merging to production
5. **Release Management**: Maintain different release versions simultaneously

## Next Steps

Now that you understand versions in Lix, explore related concepts:

- [Change Graph](./change-graph) - The underlying structure that powers versions
- [Changes](./changes) - The individual modifications tracked in versions
- [Snapshots](./snapshots) - How content states are captured in different versions