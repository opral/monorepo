# Filesystem

Lix provides a filesystem with files and directories. Files contain binary data that [plugins](/docs/plugins) process to detect changes.

## Path Requirements

Paths must be normalized before use:

- **NFC-normalized** Unicode strings
- **Slash-prefixed** (e.g., `/config.json`)
- **No relative segments** (`.` or `..`)
- **No backslashes** or invalid percent-encoding
- **File paths**: No trailing slash (e.g., `/dir/file.json`)
- **Directory paths**: Trailing slash required (e.g., `/dir/`)

Use the exported helpers to normalize paths:

```ts
import {
  normalizeFilePath,
  normalizeDirectoryPath,
  normalizePathSegment,
} from "@lix-js/sdk";

const filePath = normalizeFilePath("/config.json");
const dirPath = normalizeDirectoryPath("/configs/");
const segment = normalizePathSegment("my-file");
```

## Files

### Adding Files

```ts
await lix.db
  .insertInto("file")
  .values({
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify({ theme: "dark" })),
  })
  .execute();
```

**Automatic directory creation:** Ancestor directories are created automatically if they don't exist. You don't need to create `/configs/` before adding `/configs/app.json`.

**Path collision detection:** Inserting a file will fail if a directory already exists at that path.

### Reading Files

#### Current State

```ts
// Get a specific file
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/config.json")
  .selectFirst();

// Get all files
const allFiles = await lix.db.selectFrom("file").selectAll().execute();
```

#### By Version

Query a file at a specific [version](/docs/versions):

```ts
const file = await lix.db
  .selectFrom("file_by_version")
  .where("path", "=", "/config.json")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("version")
      .where("name", "=", "feature-branch")
      .select("commit_id"),
  )
  .selectFirst();
```

#### History

Query file history across commits:

```ts
const history = await lix.db
  .selectFrom("file_history")
  .where("path", "=", "/config.json")
  .where("lixcol_root_commit_id", "=", currentCommit)
  .orderBy("lixcol_depth", "asc")
  .execute();
```

See [History](/docs/history) for more details.

### Updating Files

```ts
await lix.db
  .updateTable("file")
  .where("path", "=", "/config.json")
  .set({
    data: new TextEncoder().encode(JSON.stringify({ theme: "light" })),
  })
  .execute();
```

When you update a file, [plugins](/docs/plugins) automatically detect changes and create entity records.

### Deleting Files

```ts
await lix.db.deleteFrom("file").where("path", "=", "/config.json").execute();
```

### File Metadata

Add application-specific data using [metadata](/docs/metadata):

```ts
await lix.db
  .insertInto("file")
  .values({
    path: "/import.csv",
    data: csvData,
    metadata: {
      imported_from: "external-system",
      import_date: new Date().toISOString(),
    },
  })
  .execute();
```

## Directories

Directories organize files in a hierarchical structure. The root directory is represented by `/`.

Each directory has:

- **name**: Directory segment name
- **parent_id**: Reference to parent directory (null for root-level directories)
- **hidden**: Boolean flag for hidden directories (defaults to false)

Directories enforce uniqueness by `(name, parent_id)`, preventing duplicate names in the same parent.

### Creating Directories

```ts
await lix.db
  .insertInto("directory")
  .values({
    path: "/configs/",
    hidden: false,
  })
  .execute();
```

### Listing Directory Contents

```ts
// List all files in a directory
const files = await lix.db
  .selectFrom("file")
  .where("path", "like", "/configs/%")
  .selectAll()
  .execute();

// List immediate subdirectories
const subdirs = await lix.db
  .selectFrom("directory")
  .where("path", "like", "/configs/%/")
  .where("path", "not like", "/configs/%/%/")
  .selectAll()
  .execute();
```

### Deleting Directories

```ts
await lix.db.deleteFrom("directory").where("path", "=", "/configs/").execute();
```

**Cascade delete:** Deleting a directory automatically removes all files and subdirectories within it.

## Internal: File Structure

Files in Lix are composed of two parts:

### File Descriptor

A tracked [entity](/docs/schemas) containing structural information:

- **id**: Unique identifier (auto-generated UUID)
- **directory_id**: Reference to parent directory (null for root `/`)
- **name**: File name without extension (e.g., `config` for `config.json`)
- **extension**: File extension without dot (e.g., `json`), null if no extension
- **metadata**: Optional JSON object for application-specific data
- **hidden**: Boolean flag for hidden files

The file path is derived from the directory hierarchy + name + extension. This structure enables efficient path-based queries and directory operations.

### File Data

The `file.data` column is not stored directly. It's materialized from [plugin](/docs/plugins) change records:

1. **Plugin matching**: Lix finds a plugin whose `detectChangesGlob` matches the file path
2. **Change retrieval**: Retrieves all change records for that file and plugin
3. **Materialization**: Calls the plugin's `applyChanges` function to reconstruct the binary data
4. **Caching**: Results are cached for performance
5. **Fallback**: If no plugin matches, the built-in `lix_unknown_file_fallback_plugin` stores the raw bytes

This design enables schema-aware change tracking while still providing direct file access.

## See Also

- [Plugins](/docs/plugins) - How plugins process files to detect changes
- [SQL Interface](/docs/sql-interface) - Query files at different levels
- [Schemas](/docs/schemas) - How file content becomes trackable entities
