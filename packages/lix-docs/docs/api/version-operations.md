# Version Operations

The Version Operations API provides functions for creating and managing versions in the Lix system. Versions in Lix are similar to branches in Git, providing named references to specific states in the change history.

## Working with Versions

### `createVersion()`

Creates a new version in the database, optionally inheriting from an existing version.

```typescript
import { createVersion } from "@lix-js/sdk";

async function createNewVersion(lix, name, changeSetId, parentVersionId = null) {
  const version = await createVersion({
    lix,
    name,
    changeSet: { id: changeSetId },
    // Optionally inherit from another version
    ...(parentVersionId ? { inherits_from_version_id: parentVersionId } : {})
  });
  
  console.log(`Created version "${name}" with ID: ${version.id}`);
  return version;
}
```

**Parameters**:
- `options: CreateVersionOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `id?: string` - Optional custom ID for the version
  - `name?: string` - Optional name for the version
  - `changeSet?: { id: string }` - Optional change set to associate with the version
  - `inherits_from_version_id?: string` - Optional parent version to inherit from

**Returns**: `Promise<Version>` - The created version object

**Source Code**: [createVersion](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/create-version.ts)

---

### `switchVersion()`

Switches the active version to a different version, updating the current state to reflect that version.

```typescript
import { switchVersion } from "@lix-js/sdk";

async function switchToVersion(lix, versionId) {
  // Switch to the specified version
  await switchVersion({
    lix,
    to: versionId
  });
  
  console.log(`Switched to version: ${versionId}`);
}
```

**Parameters**:
- `options: SwitchVersionOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `to: string` - ID of the version to switch to

**Returns**: `Promise<void>`

**Source Code**: [switchVersion](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/switch-version.ts)

## Querying Versions

You can query versions using SQL through Lix's database interface:

```typescript
// Get all versions
const versions = await lix.db
  .selectFrom("version")
  .selectAll()
  .execute();

// Get a specific version by name
const mainVersion = await lix.db
  .selectFrom("version")
  .where("name", "=", "main")
  .selectAll()
  .executeTakeFirstOrThrow();

// Get versions with their latest change sets
const versionsWithChangeSets = await lix.db
  .selectFrom("version")
  .leftJoin("change_set", "version.change_set_id", "change_set.id")
  .select([
    "version.id as version_id",
    "version.name as version_name",
    "change_set.id as change_set_id",
    "change_set.created_at"
  ])
  .execute();
```

## Version Relationships

Versions can inherit from other versions, creating a hierarchy:

```typescript
// Get version inheritance relationships
const versionHierarchy = await lix.db
  .selectFrom("version")
  .leftJoin("version as parent", "version.inherits_from_version_id", "parent.id")
  .select([
    "version.id",
    "version.name",
    "parent.id as parent_id",
    "parent.name as parent_name"
  ])
  .execute();
```

## Working with Change Sets in Versions

Each version points to a specific change set that represents its current state:

```typescript
// Get the current change set for a version
const currentState = await lix.db
  .selectFrom("version")
  .where("version.id", "=", versionId)
  .leftJoin("change_set", "version.change_set_id", "change_set.id")
  .selectAll()
  .executeTakeFirstOrThrow();

// Update a version to point to a new change set
await lix.db
  .updateTable("version")
  .set({
    change_set_id: newChangeSetId
  })
  .where("id", "=", versionId)
  .execute();
```

## Version Lifecycle Management

Lix provides a structured approach to managing the lifecycle of versions:

### Creating a Main Version

```typescript
import { createVersion, createChangeSet } from "@lix-js/sdk";

async function initializeMainVersion(lix) {
  // Create an initial change set
  const initialChangeSet = await createChangeSet({ lix });
  
  // Create the main version
  const mainVersion = await createVersion({
    lix,
    name: "main",
    changeSet: { id: initialChangeSet.id }
  });
  
  return mainVersion;
}
```

### Creating Feature Branches

```typescript
async function createFeatureBranch(lix, featureName) {
  // Get the current main version
  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .selectAll()
    .executeTakeFirstOrThrow();
  
  // Create a new version that inherits from main
  const featureVersion = await createVersion({
    lix,
    name: `feature/${featureName}`,
    changeSet: { id: mainVersion.change_set_id },
    inherits_from_version_id: mainVersion.id
  });
  
  return featureVersion;
}
```

### Merging Feature Branches

```typescript
import { createMergeChangeSet, switchVersion } from "@lix-js/sdk";

async function mergeFeatureToMain(lix, featureVersionId) {
  // Get the main version
  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .selectAll()
    .executeTakeFirstOrThrow();
  
  // Get the feature version
  const featureVersion = await lix.db
    .selectFrom("version")
    .where("id", "=", featureVersionId)
    .selectAll()
    .executeTakeFirstOrThrow();
  
  // Create a merge change set
  const mergeChangeSet = await createMergeChangeSet({
    lix,
    sources: [
      { id: mainVersion.change_set_id },
      { id: featureVersion.change_set_id }
    ]
  });
  
  // Update the main version to point to the merge change set
  await lix.db
    .updateTable("version")
    .set({
      change_set_id: mergeChangeSet.id
    })
    .where("id", "=", mainVersion.id)
    .execute();
  
  // Switch to the updated main version
  await switchVersion({
    lix,
    to: mainVersion.id
  });
  
  console.log(`Merged feature ${featureVersion.name} into main`);
}
```

## Complete Example: Version Management Workflow

Here's a comprehensive example demonstrating a version management workflow:

```typescript
import { 
  openLix, 
  newLixFile,
  handleFileInsert,
  handleFileUpdate,
  createChangeSet,
  createVersion,
  switchVersion
} from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function versionManagementWorkflow() {
  // Create and open a new Lix file
  const lixFile = await newLixFile();
  const lix = await openLix({
    blob: lixFile,
    providePlugins: [jsonPlugin]
  });
  
  // Initialize with a document
  await handleFileInsert({
    lix,
    file: {
      path: "/config.json",
      data: new TextEncoder().encode(JSON.stringify({ 
        version: "1.0.0",
        settings: { theme: "light" }
      }))
    }
  });
  
  // Create an initial change set
  const initialChangeSet = await createChangeSet({ lix });
  
  // Create the main version
  const mainVersion = await createVersion({
    lix,
    name: "main",
    changeSet: { id: initialChangeSet.id }
  });
  
  // Create a feature branch
  const featureVersion = await createVersion({
    lix,
    name: "feature/dark-theme",
    changeSet: { id: initialChangeSet.id },
    inherits_from_version_id: mainVersion.id
  });
  
  // Switch to the feature branch
  await switchVersion({
    lix,
    to: featureVersion.id
  });
  
  // Make changes in the feature branch
  await handleFileUpdate({
    lix,
    file: {
      path: "/config.json",
      data: new TextEncoder().encode(JSON.stringify({ 
        version: "1.0.0",
        settings: { theme: "dark" }
      }))
    }
  });
  
  // Create a change set for the feature work
  const featureChangeSet = await createChangeSet({ lix });
  
  // Update the feature version to point to the new change set
  await lix.db
    .updateTable("version")
    .set({
      change_set_id: featureChangeSet.id
    })
    .where("id", "=", featureVersion.id)
    .execute();
  
  // Switch back to the main branch
  await switchVersion({
    lix,
    to: mainVersion.id
  });
  
  // Verify we're back to the original content
  const mainFileData = await lix.db
    .selectFrom("file")
    .where("path", "=", "/config.json")
    .selectAll()
    .executeTakeFirstOrThrow();
  
  console.log("Main branch content:", new TextDecoder().decode(mainFileData.data));
  
  // List all versions
  const allVersions = await lix.db
    .selectFrom("version")
    .selectAll()
    .execute();
  
  console.log("All versions:", allVersions.map(v => v.name));
}
```

## Next Steps

With the Version Operations API, you can manage different versions of your data in Lix. To learn more about related functionality:

- [File Operations](./file-operations) - Work with files in Lix
- [Change Operations](./change-operations) - Track and manage changes
- [Change Graph](../guide/concepts/change-graph) - Understand the change graph that powers versions