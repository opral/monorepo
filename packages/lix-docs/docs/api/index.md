# API Reference

The Lix SDK provides a comprehensive API for working with files, changes, versions, and more. This section documents the core API functions, types, and interfaces.

## Auto-generated API Reference

For the most up-to-date and comprehensive API documentation, see the [TypeDoc generated API reference](./reference/).

This reference is automatically generated from the TypeScript source code and includes:

- All exported functions with their parameters and return types
- Type definitions and interfaces
- Detailed method descriptions and examples where available

## Key API Categories

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