# Comments

Lix has a universal commenting system. You can attach threaded conversations to any entity, whether it's a paragraph in a document, a cell in a spreadsheet, or a proposed change set.

![Comments](/comments.svg)

## Examples

```ts
import { openLix, createThread, createComment } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";

const lix = await openLix({});

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
  content: fromPlainText("This paragraph needs clarification."),
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

## Data Model

Comments are composed of two main parts:

1. **Threads:** A thread is a conversation that can be attached to one or more entities. This makes it possible to have shared conversations across entities.
2. **Comments:** Each comment belongs to a specific thread.

![Comments data model](/comments-data-model.svg)

### Comment Body (Zettel)

The body of each comment is stored in a format called [Zettel](https://github.com/opral/monorepo/tree/main/packages/zettel/zettel-ast). 

Zettel is a portable, JSON-based Abstract Syntax Tree (AST) for rich text. Think of it as a structured, machine-readable version of Markdown.

Using Zettel makes comments highly interoperable. It allows different applications and rich text editors to read, render, and edit comment content without losing formatting or data. It's designed to be extensible, so you can define your own custom elements like mentions or embedded objects, while still allowing other applications to gracefully handle unknown types.





