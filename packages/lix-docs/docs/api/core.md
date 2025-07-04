# Core API

The Core API in Lix provides the fundamental functions for creating, opening, and managing Lix instances. These functions are the entry point to working with Lix in your applications.

## Creating and Opening Lix Files

### `newLixFile()`

Creates a new empty Lix file that can be opened with `openLix` or `openLix`.

```typescript
import { newLixFile } from "@lix-js/sdk";

async function createNewLix() {
  // Create a new empty Lix file
  const lixFile = await newLixFile();
  return lixFile;
}
```

**Parameters**: None

**Returns**: `Promise<Blob>` - A blob containing an empty Lix file

**Source Code**: [newLixFile](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/new-lix.ts)

---

### `openLix()`

Opens a Lix file in memory with the provided plugins.

```typescript
import { openLix } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function openMyLix(lixFile: Blob) {
  // Open the Lix file in memory
  const lix = await openLix({
    blob: lixFile,
    providePlugins: [jsonPlugin]
  });
  return lix;
}
```

**Parameters**:
- `options: openLixOptions` - Object with the following properties:
  - `blob: Blob` - The Lix file blob to open
  - `providePlugins: LixPlugin[]` - Array of plugins to use
  - `signalProgress?: (progress: LixProgress) => void` - Optional callback for progress updates

**Returns**: `Promise<Lix>` - A Lix instance ready to use

**Source Code**: [openLix](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix-in-memory.ts)

---

### `openLix()`

Opens a Lix file from disk with the provided plugins.

```typescript
import { openLix } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

async function openLixFromDisk(filePath: string) {
  // Open the Lix file from disk
  const lix = await openLix({
    filepath: filePath,
    providePlugins: [jsonPlugin]
  });
  return lix;
}
```

**Parameters**:
- `options: OpenLixOptions` - Object with the following properties:
  - `filepath: string` - Path to the Lix file on disk
  - `providePlugins: LixPlugin[]` - Array of plugins to use
  - `signalProgress?: (progress: LixProgress) => void` - Optional callback for progress updates

**Returns**: `Promise<Lix>` - A Lix instance ready to use

**Source Code**: [openLix](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix.ts)

---

### `closeLix()`

Closes a Lix instance and releases resources.

```typescript
import { closeLix } from "@lix-js/sdk";

async function cleanupLix(lix) {
  // Close the Lix instance
  await closeLix({ lix });
  console.log("Lix instance closed");
}
```

**Parameters**:
- `options: { lix: Lix }` - Object with the Lix instance to close

**Returns**: `Promise<void>`

**Source Code**: [closeLix](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/close-lix.ts)

## The Lix Interface

When you open a Lix file, you get a `Lix` instance with the following key properties:

```typescript
interface Lix {
  db: Kysely<LixDatabaseSchema>;
  // ... other properties
}
```

The most important property is `db`, which gives you access to the database through [Kysely](https://kysely.dev/), a type-safe SQL query builder. All operations in Lix are performed through this database interface.

## Working with the Database

Here's an example of basic database operations with Lix:

```typescript
// Insert a file
const file = await lix.db
  .insertInto("file")
  .values({
    path: "/example.json",
    data: new TextEncoder().encode(JSON.stringify({ hello: "world" })),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Query files
const allFiles = await lix.db
  .selectFrom("file")
  .selectAll()
  .execute();

// Update a file
await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode(JSON.stringify({ hello: "updated world" })),
  })
  .where("path", "=", "/example.json")
  .execute();

// Delete a file
await lix.db
  .deleteFrom("file")
  .where("path", "=", "/example.json")
  .execute();
```

## Environment Configuration

Lix provides functions to work with different environments:

### `createLspInMemoryEnvironment()`

Creates an in-memory environment for Lix Language Server Protocol (LSP).

```typescript
import { createLspInMemoryEnvironment } from "@lix-js/sdk";

async function setupLspEnvironment() {
  const env = await createLspInMemoryEnvironment();
  return env;
}
```

## Working with Server Protocol

### `createServerProtocolHandler()`

Creates a handler for the Lix server protocol.

```typescript
import { createServerProtocolHandler } from "@lix-js/sdk";

function setupServerProtocol(lix) {
  const handler = createServerProtocolHandler({
    lix,
    context: { /* context data */ }
  });
  return handler;
}
```

## Utility Functions

### `toBlob()`

Converts a Lix instance to a blob for storage or transmission.

```typescript
import { toBlob } from "@lix-js/sdk";

async function saveLixToBlob(lix) {
  const blob = await toBlob({ lix });
  return blob;
}
```

**Parameters**:
- `options: { lix: Lix }` - Object with the Lix instance to convert

**Returns**: `Promise<Blob>` - A blob containing the serialized Lix data

## Next Steps

With the Core API, you can create, open, and interact with Lix files. To learn more about specific areas:

- [Database Schema](./schema) - Understand the database structure
- [File Operations](./file-operations) - Work with files in Lix
- [Change Operations](./change-operations) - Track and manage changes
- [Version Operations](./version-operations) - Work with different versions