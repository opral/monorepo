# JSON Handling in Lix SDK

This document explains the standardization of JSON handling in the Lix SDK database layer.

## Context

Previously, the Lix SDK had an inconsistent approach to JSON storage:
- The Snapshot table used JSONB format for its `content` field
- Other tables (like File, FileQueue, and MutationLog) used stringified JSON

This inconsistency made the code harder to maintain and reason about.

## Solution

We've standardized on JSONB format across the SDK and created versatile utility functions that handle both direct JavaScript values and SQL queries:

1. `jsonb<T>(value: T)`: Converts any JavaScript value to JSONB format
2. `jsonObjectFrom<T>(input: T | QueryBuilderExpression)`: Creates a JSONB object from either:
   - A JavaScript object (key-value pairs)
   - A Kysely subquery that returns a single row
3. `jsonArrayFrom<T>(input: T[] | QueryBuilderExpression)`: Creates a JSONB array from either:
   - A JavaScript array
   - A Kysely subquery that returns multiple rows

These utilities provide several benefits:

- **Consistency**: All JSON data is handled the same way, using JSONB format
- **Versatility**: Works with both direct values and SQL subqueries
- **Abstraction**: The implementation details of how JSON is stored are hidden
- **Type Safety**: Full TypeScript support
- **Maintainability**: If we need to change how JSON is stored, we only need to update these utilities

## Implementation Notes

The implementation uses Kysely's SQL template literals to ensure proper SQL generation and parameter handling.

### Basic Usage with JavaScript Values

```typescript
// Store an object as JSONB
db.insertInto("snapshot")
  .values({
    content: jsonb({
      key: "value",
      nested: { count: 42 }
    })
  })
  .execute();

// Create JSONB from an object
db.insertInto("file")
  .values({
    path: "/example/path.txt",
    data: Buffer.from("Hello World"),
    metadata: jsonObjectFrom({
      author: "User",
      tags: ["documentation"]
    })
  })
  .execute();

// Create JSONB from an array
db.insertInto("file")
  .values({
    path: "/example/tagged.txt",
    data: Buffer.from("Tagged content"),
    metadata: jsonArrayFrom(["tag1", "tag2", "tag3"])
  })
  .execute();
```

### Advanced Usage with SQL Subqueries

```typescript
// Get a file with stats as a nested JSON object
const fileWithMetadata = await db
  .selectFrom("file")
  .where("file.id", "=", "example-file-id")
  .select((eb) => [
    "file.id",
    "file.path",
    // Using jsonObjectFrom with a subquery
    jsonObjectFrom(
      eb
        .selectFrom("change")
        .select(eb => [
          eb.ref("change.created_at").as("last_modified"),
          eb.fn.count("change.id").as("change_count")
        ])
        .whereRef("change.file_id", "=", "file.id")
        .limit(1)
    ).as("file_stats")
  ])
  .executeTakeFirst();

// Get discussions with comments as nested JSON arrays
const discussionsWithComments = await db
  .selectFrom("discussion")
  .select((eb) => [
    "discussion.id",
    // Using jsonArrayFrom with a subquery
    jsonArrayFrom(
      eb
        .selectFrom("comment")
        .select(["comment.id", "comment.content"])
        .whereRef("comment.discussion_id", "=", "discussion.id")
    ).as("comments")
  ])
  .execute();
```

## Implementation Details

- Both functions detect whether they're given a JavaScript value or a Kysely query expression.
- For JavaScript values, they use `JSON.stringify()` and wrap the result with `jsonb()`.
- For Kysely subqueries:
  - `jsonObjectFrom` uses `json_object(*)` to create a single object from the first row.
  - `jsonArrayFrom` uses `json_group_array(json_object(*))` to create an array of objects.
- In both cases, the results are wrapped with `jsonb()` to ensure consistent JSONB format.

## Future Work

This standardization on JSONB opens up possibilities for:

1. Better query capabilities using JSON operators and path expressions
2. Improved performance for JSON operations
3. More consistent error handling
4. Enhanced JSON manipulation functions (patching, merging, filtering)

We could extend these utilities further with functions for JSON querying, patching, and other advanced operations.