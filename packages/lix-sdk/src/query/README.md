# Lix Query API

The query API provides a simplified, developer-friendly layer for querying and mutating data in Lix. It abstracts away the SQL complexity and change management details, allowing developers to work with a more intuitive interface.

## Features

- **Simple, SQL-free API** - No need to write complex SQL queries
- **Fluent query builder** - Chainable API for filtering, sorting, and pagination
- **Automatic change management** - Changes and changesets are handled internally
- **Type safety** - Full TypeScript support with autocompletion
- **Domain-specific methods** - Specialized methods for each entity type

## Core Components

### 1. Entity Repositories

Base repositories and entity-specific implementations for:
- `FileRepository` - Working with files
- `KeyValueRepository` - Working with key-value pairs

### 2. Query Builder

A fluent API for building database queries:
- Filtering with `where()`
- Sorting with `orderBy()`
- Pagination with `limit()` and `offset()`
- Execution methods like `execute()`, `executeTakeFirst()`, etc.

## Usage Examples

### File Operations

```typescript
// Get a file by path
const readmeFile = await lix.query.files.getByPath('/README.md');

// Query with filtering and sorting
const recentMarkdownFiles = await lix.query.files.query()
  .where('path', 'startsWith', '/docs/')
  .where('path', 'endsWith', '.md')
  .orderBy('lixcol_updated_at', 'desc')
  .limit(10)
  .execute();

// Create new file
const newFile = await lix.query.files.create({
  path: '/new-file.md',
  data: new TextEncoder().encode('# New Document')
});

// Update file content
await lix.query.files.update(fileId, { 
  data: new TextEncoder().encode('# Updated Content') 
});

// Using createOrUpdate convenience method
await lix.query.files.createOrUpdate('/readme.md', 
  new TextEncoder().encode('# Updated Content'));
```

### Key-Value Store

```typescript
// Get a single value
const theme = await lix.query.keyValues.get('user:preferences:theme');

// Store a value
await lix.query.keyValues.set('user:preferences:theme', 'dark');

// Query multiple values
const userPrefs = await lix.query.keyValues.query()
  .where('key', 'startsWith', 'user:preferences:')
  .execute();
```

## Comparison with Raw SQL Approach

### Before (Raw SQL):

```typescript
// Creating a file
const result = await lix.db
  .insertInto("file")
  .values({
    path: "/example.md",
    data: new TextEncoder().encode("# Example"),
  })
  .returning("id")
  .executeTakeFirstOrThrow();

// Updating requires manually creating changes and changesets
const snapshot = await createSnapshot({
  lix,
  content: { /* file data */ },
});

const change = await createChange({
  lix,
  entity_id: fileId,
  schema_key: "lix_file",
  schema_version: "1.0",
  file_id: fileId,
  plugin_key: "plugin_key",
  snapshot: { content: { /* updated file data */ } },
});

await createChangeSet({
  lix,
  elements: [{ change_id: change.id, entity_id: fileId, schema_key: "lix_file", file_id: fileId }],
  parents: [activeVersionChangeSetId],
});
```

### After (Query API):

```typescript
// Creating a file
const file = await lix.query.files.create({
  path: "/example.md",
  data: new TextEncoder().encode("# Example"),
});

// Updating a file (changes and changesets handled internally)
await lix.query.files.update(file.id, {
  data: new TextEncoder().encode("# Updated Example"),
});

// Or even simpler with convenience methods
await lix.query.files.createOrUpdate(
  "/example.md", 
  new TextEncoder().encode("# Updated Example")
);
```

## Benefits

1. **Simplified API** - Reduces boilerplate and cognitive load
2. **Improved Readability** - Makes code more maintainable
3. **Error Prevention** - Reduces opportunities for mistakes in change management
4. **Documentation Friendly** - Easier to document and provide examples
5. **Consistent Interface** - Same patterns across different entity types

For more examples, see:
- [File Repository Example](./example.ts)
- [Markdown Plugin Example](./markdown-plugin-example.ts)
- [Comparison Example](./comparison-example.ts)