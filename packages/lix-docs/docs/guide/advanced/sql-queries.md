# SQL Queries

Lix provides a powerful SQL-based query interface for interacting with the underlying database. This approach gives you full flexibility when working with your data while maintaining type safety.

## Overview

The Lix database is built on SQLite (running in WebAssembly in the browser) and uses [Kysely](https://kysely.dev/) as a type-safe SQL query builder. This means you can leverage both the power of SQL and TypeScript's type system.

## Accessing the Database

You can access the database through the `db` property of your Lix instance:

```typescript
// Create and open a Lix instance
const lixFile = await newLixFile();
const lix = await openLix({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});

// Access the database
const db = lix.db;
```

## Basic Queries

### Selecting Data

```typescript
// Get all files
const files = await lix.db.selectFrom("file").selectAll().execute();

// Get specific columns
const fileInfo = await lix.db
  .selectFrom("file")
  .select(["id", "path", "created_at"])
  .execute();
```

### Filtering Data

```typescript
// Get changes for a specific file
const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", fileId)
  .selectAll()
  .execute();

// Get changes within a date range
const recentChanges = await lix.db
  .selectFrom("change")
  .where("created_at", ">", lastWeek)
  .orderBy("created_at", "desc")
  .selectAll()
  .execute();
```

### Joining Tables

```typescript
// Get changes with their snapshots
const changesWithSnapshots = await lix.db
  .selectFrom("change")
  .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
  .select([
    "change.id",
    "change.file_id",
    "change.from_value",
    "change.to_value",
    "snapshot.id as snapshot_id",
    "snapshot.created_at",
  ])
  .execute();
```

## Advanced Queries

### Aggregation

```typescript
// Count changes per file
const changesByFile = await lix.db
  .selectFrom("change")
  .select((eb) => ["file_id", eb.fn.count("id").as("change_count")])
  .groupBy("file_id")
  .execute();
```

### JSON Extraction

Many fields in Lix store JSON data. You can query inside JSON values using SQLite's JSON functions:

```typescript
// Query using JSON path extraction
const cellChanges = await lix.db
  .selectFrom("change")
  .where(sql`json_extract(change.metadata, '$.entity_type')`, "=", "cell")
  .selectAll()
  .execute();
```

### Complex Conditions

```typescript
// Find changes matching multiple conditions
const specificChanges = await lix.db
  .selectFrom("change")
  .where((eb) =>
    eb.or([
      eb("file_id", "=", fileId),
      eb.and([
        eb("created_at", ">", lastWeek),
        eb("metadata", "like", "%important%"),
      ]),
    ]),
  )
  .selectAll()
  .execute();
```

## Raw SQL

For complex queries that are difficult to express with the query builder, you can use raw SQL:

```typescript
// Use raw SQL for complex queries
const result = await lix.db.executeQuery(sql`
  SELECT 
    c.id, 
    c.file_id, 
    json_extract(c.metadata, '$.entity_type') as entity_type,
    c.from_value,
    c.to_value
  FROM change c
  WHERE json_extract(c.metadata, '$.entity_type') = 'cell'
  AND c.file_id = ${fileId}
  ORDER BY c.created_at DESC
`);
```

## Common Query Patterns

### Querying the Change Graph

```typescript
// Get all change sets in the current branch
const changeSets = await lix.db
  .selectFrom("change_set")
  .where("is_current_branch", "=", 1)
  .selectAll()
  .execute();

// Get the relationship between change sets
const edges = await lix.db
  .selectFrom("change_set_edge")
  .innerJoin(
    "change_set as from_cs",
    "from_cs.id",
    "change_set_edge.from_change_set_id",
  )
  .innerJoin(
    "change_set as to_cs",
    "to_cs.id",
    "change_set_edge.to_change_set_id",
  )
  .select([
    "change_set_edge.from_change_set_id",
    "change_set_edge.to_change_set_id",
    "from_cs.name as from_name",
    "to_cs.name as to_name",
  ])
  .execute();
```

### Working with Versions

```typescript
// Get all versions
const versions = await lix.db
  .selectFrom("version")
  .leftJoin("change_set", "change_set.id", "version.current_change_set_id")
  .select([
    "version.id",
    "version.name",
    "version.created_at",
    "change_set.id as current_change_set_id",
  ])
  .execute();

// Get the current version
const currentVersion = await lix.db
  .selectFrom("version")
  .where("is_current", "=", 1)
  .selectAll()
  .executeTakeFirst();
```

## Using Database Transactions

For operations that need to be atomic, you can use transactions:

```typescript
// Execute multiple operations in a transaction
await lix.db.transaction().execute(async (trx) => {
  // Create a snapshot
  const snapshot = await trx
    .insertInto("snapshot")
    .values({
      created_at: new Date().toISOString(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Create changes associated with the snapshot
  await trx
    .insertInto("change")
    .values([
      {
        file_id: fileId,
        snapshot_id: snapshot.id,
        created_at: new Date().toISOString(),
        from_value: "old value",
        to_value: "new value",
        metadata: JSON.stringify({
          entity_type: "property",
          path: ["settings", "name"],
        }),
      },
      {
        file_id: fileId,
        snapshot_id: snapshot.id,
        created_at: new Date().toISOString(),
        from_value: "10",
        to_value: "20",
        metadata: JSON.stringify({
          entity_type: "property",
          path: ["settings", "count"],
        }),
      },
    ])
    .execute();
});
```

## Performance Considerations

- **Indexes**: Lix creates indexes on commonly queried fields, but complex queries may benefit from adding your own indexes.
- **Large Result Sets**: When dealing with large result sets, consider using pagination or limiting the results.
- **Complex JSON Queries**: Extracting data from JSON fields can be less efficient than querying normal columns. For frequently accessed JSON properties, consider adding helper functions.

## Further Reading

- [Kysely Documentation](https://kysely.dev/docs/intro)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [SQL.js Documentation](https://sql.js.org/)
