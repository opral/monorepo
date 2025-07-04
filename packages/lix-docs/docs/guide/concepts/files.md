# Files

Files are the primary data containers in Lix. They represent the content that changes over time.

## What are Files in Lix?

In Lix, a file is a named container for data, similar to files in a traditional filesystem. Each file has:

- A unique identifier
- A path (similar to a file path in a filesystem)
- Binary content data
- Metadata (creation time, modification time, etc.)

Files are stored in the Lix database and can be queried using SQL.

## File Table Schema

The file table has the following schema:

```typescript
interface LixFile {
  id: string;
  path: string;
  data: Uint8Array;
  created_at: string;
  updated_at: string;
  type: string;
}
```

## Working with Files

### Creating Files

You can create a file by inserting it into the `file` table:

```javascript
const file = await lix.db
  .insertInto("file")
  .values({
    path: "/example.json",
    data: new TextEncoder().encode(JSON.stringify(data)),
  })
  .returningAll()
  .executeTakeFirstOrThrow();
```

### Reading Files

You can read a file by querying the `file` table:

```javascript
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.json")
  .selectAll()
  .executeTakeFirstOrThrow();

// Convert binary data to string (for text-based files)
const content = new TextDecoder().decode(file.data);
```

### Updating Files

You can update a file by updating its record in the `file` table:

```javascript
await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode(JSON.stringify(updatedData)),
  })
  .where("path", "=", "/example.json")
  .execute();
```

When you update a file, Lix automatically:
1. Detects what changed in the file
2. Creates change records to track those modifications
3. Groups the changes into a snapshot

### Deleting Files

You can delete a file by removing it from the `file` table:

```javascript
await lix.db
  .deleteFrom("file")
  .where("path", "=", "/example.json")
  .execute();
```

## File Types and Plugins

Lix uses plugins to understand the structure of different file types. These plugins enable Lix to:

1. Parse the file's content
2. Detect changes between versions
3. Apply changes to the file

Each file type has a corresponding plugin:

- JSON files: [JSON plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-json)
- CSV files: [CSV plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-csv)
- Markdown files: [Markdown plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-md)
- And more...

When opening a Lix instance, you specify which plugins to use:

```javascript
const lix = await openLix({
  blob: lixFile,
  providePlugins: [jsonPlugin, csvPlugin],
});
```

## Next Steps

Now that you understand files in Lix, explore related concepts:

- [Changes](./changes) - Learn how changes to files are tracked
- [Snapshots](./snapshots) - Understand how changes are grouped
- [Versions](./versions) - See how different states of files are managed