# File Operations

The File Operations API provides functions for working with files in the Lix system. These operations allow you to insert, update, query, and materialize files, providing the foundation for content management in Lix.

## Working with Files

### `handleFileInsert()`

Inserts a new file into the Lix database and automatically detects changes using the appropriate plugin for the file format.

```typescript
import { handleFileInsert } from "@lix-js/sdk";

async function addNewFile(lix, path, content) {
  // Create a file object
  const file = {
    path,
    data: new TextEncoder().encode(content)
  };
  
  // Insert the file and detect changes
  await handleFileInsert({
    lix,
    file,
    versionId: "current" // Uses the current active version
  });
  
  console.log(`File ${path} inserted successfully`);
}
```

**Parameters**:
- `options: FileHandlerOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `file: { path: string; data: Uint8Array }` - The file to insert
  - `versionId?: string` - Optional version ID (defaults to current version)

**Returns**: `Promise<0 | 1>` - Returns 1 if changes were detected, 0 otherwise

**Source Code**: [handleFileInsert](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/file/file-handlers.ts)

---

### `handleFileUpdate()`

Updates an existing file in the Lix database and automatically detects changes using the appropriate plugin for the file format.

```typescript
import { handleFileUpdate } from "@lix-js/sdk";

async function updateExistingFile(lix, path, newContent) {
  // Create a file object with updated content
  const file = {
    path,
    data: new TextEncoder().encode(newContent)
  };
  
  // Update the file and detect changes
  await handleFileUpdate({
    lix,
    file,
    versionId: "current" // Uses the current active version
  });
  
  console.log(`File ${path} updated successfully`);
}
```

**Parameters**:
- `options: FileHandlerOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `file: { path: string; data: Uint8Array }` - The file with updated content
  - `versionId?: string` - Optional version ID (defaults to current version)

**Returns**: `Promise<0 | 1>` - Returns 1 if changes were detected, 0 otherwise

**Source Code**: [handleFileUpdate](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/file/file-handlers.ts)

---

### `materializeFileData()`

Materializes file data from changes stored in the database, reconstructing the file content at a specific version point.

```typescript
import { materializeFileData } from "@lix-js/sdk";

async function getFileContent(lix, path, versionId = "current") {
  // Get the file record
  const file = await lix.db
    .selectFrom("file")
    .where("path", "=", path)
    .selectAll()
    .executeTakeFirstOrThrow();
  
  // Materialize the file data for the specified version
  const fileData = await materializeFileData({
    lix,
    file,
    versionId
  });
  
  // Convert binary data to text
  const content = new TextDecoder().decode(fileData);
  return content;
}
```

**Parameters**:
- `options: MaterializeFileDataOptions` - Object with the following properties:
  - `lix: Lix` - The Lix instance
  - `file: { id: string; path: string; ... }` - The file record
  - `versionId?: string` - Optional version ID (defaults to current version)

**Returns**: `Promise<Uint8Array>` - The file content as a binary array

**Source Code**: [materializeFileData](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/file/materialize-file-data.ts)

## Querying Files

You can query files using SQL through Lix's database interface:

```typescript
// Get all files
const files = await lix.db
  .selectFrom("file")
  .selectAll()
  .execute();

// Get a specific file by path
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.json")
  .selectAll()
  .executeTakeFirstOrThrow();

// Find files by pattern
const markdownFiles = await lix.db
  .selectFrom("file")
  .where("path", "like", "%.md")
  .selectAll()
  .execute();
```

## Handling File Content

Lix stores file content as binary data (`Uint8Array`), requiring conversion between text and binary formats:

```typescript
// Converting text to binary (for insertion/update)
const content = "Hello, world!";
const binaryData = new TextEncoder().encode(content);

// Converting binary to text (after materialization)
const fileContent = await materializeFileData({ lix, file, versionId });
const text = new TextDecoder().decode(fileContent);
```

## Using File Operations with Plugins

File operations work in conjunction with plugins to understand file structure:

```typescript
import { openLix, handleFileInsert } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function workWithJsonFile() {
  // Open Lix with the JSON plugin
  const lix = await openLix({
    filepath: "/path/to/lix-file",
    providePlugins: [jsonPlugin]
  });
  
  // Insert a JSON file
  const jsonContent = JSON.stringify({ hello: "world" }, null, 2);
  await handleFileInsert({
    lix,
    file: {
      path: "/example.json",
      data: new TextEncoder().encode(jsonContent)
    }
  });
  
  // Later, update the JSON file
  const updatedJson = JSON.stringify({ hello: "updated world" }, null, 2);
  await handleFileUpdate({
    lix,
    file: {
      path: "/example.json",
      data: new TextEncoder().encode(updatedJson)
    }
  });
}
```

## Transaction Support

For more complex operations, you can use transactions to ensure atomicity:

```typescript
// Execute multiple file operations in a transaction
await lix.db.transaction().execute(async (trx) => {
  // Get transactional Lix instance
  const trxLix = { ...lix, db: trx };
  
  // Insert multiple files
  await handleFileInsert({
    lix: trxLix,
    file: { path: "/file1.json", data: /* ... */ }
  });
  
  await handleFileInsert({
    lix: trxLix,
    file: { path: "/file2.json", data: /* ... */ }
  });
});
```

## Next Steps

With the File Operations API, you can manage files in your Lix application. To learn more about related functionality:

- [Change Operations](./change-operations) - Track and manage changes to files
- [Version Operations](./version-operations) - Work with different versions of files
- [Plugins](../plugins/) - Extend Lix with support for different file formats