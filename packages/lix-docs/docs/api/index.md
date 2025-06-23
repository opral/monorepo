# API Reference

The Lix SDK provides a comprehensive API for working with files, changes, versions, and more. This section documents the core API functions, types, and interfaces.

## Core APIs

The core APIs provide the fundamental functionality for creating, opening, and managing Lix files:

- [newLixFile()](./core#newlixfile) - Create a new empty Lix file
- [openLix()](./core#openlix) - Open a Lix file from disk
- [openLixInMemory()](./core#openlixinmemory) - Open a Lix file in memory
- [closeLix()](./core#closelix) - Close a Lix instance

## File Operations

Functions for working with files:

- [handleFileInsert()](./file-operations#handlefileinsert) - Insert a new file and detect changes
- [handleFileUpdate()](./file-operations#handlefileupdate) - Update an existing file and detect changes
- [materializeFileData()](./file-operations#materializefiledata) - Reconstruct file content from changes

## Change Operations

Functions for working with changes and change sets:

- [createChange()](./change-operations#createchange) - Create a change record
- [createChangeSet()](./change-operations#createchangeset) - Create a collection of related changes
- [applyChangeSet()](./change-operations#applychangeset) - Apply a change set to update state
- [createCheckpoint()](./change-operations#createcheckpoint) - Create a named checkpoint in history

## Version Operations

Functions for working with versions:

- [createVersion()](./version-operations#createversion) - Create a new version
- [switchVersion()](./version-operations#switchversion) - Switch to a different version
- Various helper methods for version management

## Utilities

Helper functions for common tasks:

- [toBlob()](./utilities#toblob) - Serialize a Lix instance to a blob
- [saveLixToOpfs()](./utilities#savelixtopfs) - Save Lix to browser storage
- Progress tracking and other helper functions

## Database Schema

Lix uses a SQL database to store and query data. The [database schema](./schema) includes tables for:

- `file` - Stores file metadata and content
- `change` - Records individual changes to files
- `change_set` - Collections of related changes
- `snapshot` - Groups related changes together
- `version` - Manages different versions of the data
- And more...

Each table has a corresponding TypeScript interface that defines its structure.

## Type Definitions

The SDK includes comprehensive TypeScript type definitions for all entities and functions, providing type safety and autocompletion in your IDE:

```typescript
// Database schema types
interface LixDatabaseSchema {
  file: File;
  change: Change;
  change_set: ChangeSet;
  version: Version;
  // ... and more
}

// The main Lix interface
interface Lix {
  db: Kysely<LixDatabaseSchema>;
  // ... other properties
}
```

## Example Usage

Here's a complete example of using the Lix API:

```typescript
import { newLixFile, openLixInMemory, handleFileInsert, createChangeSet, toBlob } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function workWithLix() {
  // Create a new Lix file
  const lixFile = await newLixFile();
  
  // Open it with the JSON plugin
  const lix = await openLixInMemory({
    blob: lixFile,
    providePlugins: [jsonPlugin]
  });
  
  // Insert a JSON file
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
  
  // Create a change set to track these changes
  const changeSet = await createChangeSet({ lix });
  console.log("Created change set:", changeSet.id);
  
  // Query the changes
  const changes = await lix.db
    .selectFrom("change")
    .selectAll()
    .execute();
  
  console.log(`Detected ${changes.length} changes`);
  
  // Save the Lix file for later use
  const savedBlob = await toBlob({ lix });
  console.log(`Saved ${savedBlob.size} bytes`);
  
  return savedBlob;
}
```

## Additional Resources

- [Getting Started Guide](../guide/getting-started) - Step-by-step introduction to Lix
- [Concept Documentation](../guide/concepts/changes) - Understand the core concepts
- [Plugin Documentation](../plugins/) - Learn about available plugins