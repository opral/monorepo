# Utility Functions

Lix provides several utility functions that help with common tasks when working with the SDK. These functions make it easier to work with serialization, progress tracking, and other cross-cutting concerns.

## Serialization Utilities

### `toBlob()`

Converts a Lix instance to a blob for storage or transmission.

```typescript
import { toBlob } from "@lix-js/sdk";

async function serializeLix(lix) {
  // Convert the Lix instance to a blob
  const blob = await toBlob({ lix });
  
  // Now you can save this blob to a file, send it over the network, etc.
  console.log(`Serialized Lix to a ${blob.size} byte blob`);
  return blob;
}
```

**Parameters**:
- `options: { lix: Lix }` - Object with the Lix instance to convert

**Returns**: `Promise<Blob>` - A blob containing the serialized Lix data

**Source Code**: [toBlob](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/to-blob.ts)

---

### `saveLixToOpfs()`

Saves a Lix instance to the Origin Private File System (OPFS), which is a persistent storage mechanism in modern browsers.

```typescript
import { saveLixToOpfs, toBlob } from "@lix-js/sdk";

async function persistLix(lix, filename = "my-lix-file.lix") {
  // First, convert the Lix instance to a blob
  const blob = await toBlob({ lix });
  
  // Then, save it to the Origin Private File System
  await saveLixToOpfs({
    blob,
    filename
  });
  
  console.log(`Saved Lix to OPFS as ${filename}`);
}
```

**Parameters**:
- `options: SaveLixToOpfsOptions` - Object with the following properties:
  - `blob: Blob` - The serialized Lix blob
  - `filename: string` - The name to use for the file in OPFS

**Returns**: `Promise<void>`

**Usage Note**: This function is only available in browser environments that support the Origin Private File System API.

## Progress Tracking

### `LixProgress` Type

Lix provides a type for tracking progress during operations:

```typescript
interface LixProgress {
  type: "progress";
  step: number;
  total: number;
  message: string;
}
```

You can use this with the `signalProgress` parameter in various Lix functions:

```typescript
import { openLixInMemory } from "@lix-js/sdk";

async function openLixWithProgress(blob) {
  const lix = await openLixInMemory({
    blob,
    providePlugins: [/* plugins */],
    signalProgress: (progress) => {
      console.log(`Step ${progress.step} of ${progress.total}: ${progress.message}`);
      // Update UI progress bar
      const percentComplete = (progress.step / progress.total) * 100;
      updateProgressBar(percentComplete);
    }
  });
  
  return lix;
}
```

## Query Filters

Lix provides special query filters for common operations:

### `changeInVersion()`

A filter to find changes that are part of a specific version.

```typescript
import { changeInVersion } from "@lix-js/sdk";

async function getChangesInVersion(lix, versionId) {
  const changes = await lix.db
    .selectFrom("change")
    .where(changeInVersion(versionId))
    .selectAll()
    .execute();
  
  return changes;
}
```

### `fileInVersion()`

A filter to find files that are present in a specific version.

```typescript
import { fileInVersion } from "@lix-js/sdk";

async function getFilesInVersion(lix, versionId) {
  const files = await lix.db
    .selectFrom("file")
    .where(fileInVersion(versionId))
    .selectAll()
    .execute();
  
  return files;
}
```

## Environment Utilities

### `createLspInMemoryEnvironment()`

Creates an in-memory environment for Lix Language Server Protocol (LSP).

```typescript
import { createLspInMemoryEnvironment } from "@lix-js/sdk";

async function setupLspEnvironment() {
  const env = await createLspInMemoryEnvironment();
  return env;
}
```

This is useful for integrating Lix with language servers and code editors.

## Server Protocol Utilities

### `createServerProtocolHandler()`

Creates a handler for the Lix server protocol, enabling remote interaction with Lix instances.

```typescript
import { createServerProtocolHandler } from "@lix-js/sdk";

function setupServerProtocol(lix) {
  const handler = createServerProtocolHandler({
    lix,
    context: { /* context data */ }
  });
  
  // Use the handler to process incoming requests
  async function handleRequest(request) {
    const response = await handler(request);
    return response;
  }
  
  return handleRequest;
}
```

This is useful for implementing server-side Lix functionality.

## Debugging Utilities

### `getLixVersion()`

Gets the current version of the Lix SDK.

```typescript
import { getLixVersion } from "@lix-js/sdk";

function logLixVersion() {
  const version = getLixVersion();
  console.log(`Running Lix SDK version ${version}`);
}
```

## Complete Example: Saving and Loading Lix Files

Here's a comprehensive example demonstrating how to use the utility functions to save and load Lix files:

```typescript
import { 
  newLixFile, 
  openLixInMemory, 
  toBlob, 
  handleFileInsert 
} from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function saveAndLoadLix() {
  // Create a new Lix file
  const emptyLixBlob = await newLixFile();
  
  // Open the Lix file
  const lix = await openLixInMemory({
    blob: emptyLixBlob,
    providePlugins: [jsonPlugin],
    signalProgress: (progress) => {
      console.log(`Progress: ${progress.step}/${progress.total} - ${progress.message}`);
    }
  });
  
  // Add a file to it
  await handleFileInsert({
    lix,
    file: {
      path: "/example.json",
      data: new TextEncoder().encode(JSON.stringify({ hello: "world" }))
    }
  });
  
  // Serialize the Lix instance
  const savedLixBlob = await toBlob({ lix });
  
  // In a browser environment, you could save to OPFS
  if (typeof navigator !== 'undefined' && 'storage' in navigator) {
    await saveLixToOpfs({
      blob: savedLixBlob,
      filename: "example.lix"
    });
    console.log("Saved to OPFS successfully");
  }
  
  // Or you could save it to a file using the File System Access API
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "example.lix",
        types: [{
          description: "Lix File",
          accept: { "application/octet-stream": [".lix"] }
        }]
      });
      
      const writable = await handle.createWritable();
      await writable.write(savedLixBlob);
      await writable.close();
      console.log("Saved to file successfully");
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }
  
  // Later, you can reopen the Lix file
  const reopenedLix = await openLixInMemory({
    blob: savedLixBlob,
    providePlugins: [jsonPlugin]
  });
  
  // Verify the file is still there
  const files = await reopenedLix.db
    .selectFrom("file")
    .selectAll()
    .execute();
  
  console.log("Reopened Lix file, found files:", files.map(f => f.path));
}
```

## Next Steps

With these utility functions, you can efficiently work with Lix in various environments and scenarios. To learn more about related functionality:

- [Core API](./core) - Understand the core Lix API
- [File Operations](./file-operations) - Work with files in Lix
- [Change Operations](./change-operations) - Track and manage changes