# Comments

```ts
const lix = await openLix({});
```

```ts
// Create a thread on any entity (change set, CSV cell, markdown paragraph, etc.)
const thread = await createThread({
  lix,
  entity: {
    id: "para_456",
    schema_key: "markdown_paragraph",
    file_id: "README.md",
  },
});

// Add a comment to the thread
const comment = await createComment({
  lix,
  thread: thread.id,
  content: "This paragraph needs clarification.",
});
```

```ts
// Thread on a CSV cell
const csvThread = await createThread({
  lix,
  entity: {
    id: "row_789::column_2",
    schema_key: "csv_cell",
    file_id: "data.csv"
  }
});

// Thread on a change set (change sets are entities too!)
const changeSetThread = await createThread({
  lix,
  entity: {
    id: changeSet.id,
    schema_key: "lix_change_set"
    file_id: "lix"
  }
});
```

```ts
// Get all threads for a specific entity
const selectedEntity = {
  entity_id: "0-jsa9j3",
  schema_key: "csv_cell",
  file_id: "doc_456",
};

const threads = await selectThreads({ lix })
  .where(entityIs(selectedEntity))
  .execute();
```
