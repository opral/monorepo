# Comments

Lix has a universal commenting system. You can attach conversations to any entity, whether it's a paragraph in a document, a cell in a spreadsheet, or a proposed change set.

![Comments](/comments.svg)

## Examples

```ts
import { openLix, createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";

const lix = await openLix({});

// Create a conversation on any entity (change set, CSV cell, markdown paragraph, etc.)
const conversation = await createConversation({
  lix,
  entity: {
    id: "para_456",
    schema_key: "markdown_paragraph",
    file_id: "README.md",
  },
});

// Add a message to the conversation
const message = await createConversationMessage({
  lix,
  conversation_id: conversation.id,
  body: fromPlainText("This paragraph needs clarification."),
});
```

```ts
// Conversation on a CSV cell
const csvConversation = await createConversation({
  lix,
  entity: {
    id: "row_789::column_2",
    schema_key: "csv_cell",
    file_id: "data.csv",
  },
});

// Conversation on a change set (change sets are entities too!)
const changeSetConversation = await createConversation({
  lix,
  entity: {
    id: changeSet.id,
    schema_key: "lix_change_set",
    file_id: "lix",
  },
});
```

```ts
// Get all conversations for a specific entity
const selectedEntity = {
  entity_id: "0-jsa9j3",
  schema_key: "csv_cell",
  file_id: "doc_456",
};

const conversations = await lix.db
  .selectFrom("conversation")
  .innerJoin(
    "entity_conversation",
    "entity_conversation.conversation_id",
    "conversation.id",
  )
  .where("entity_conversation.entity_id", "=", selectedEntity.entity_id)
  .where("entity_conversation.schema_key", "=", selectedEntity.schema_key)
  .where("entity_conversation.file_id", "=", selectedEntity.file_id)
  .selectAll("conversation")
  .execute();
```

## Data Model

Comments are composed of two main parts:

1. **Conversations:** A conversation is a discussion that can be attached to one or more entities. This makes it possible to have shared conversations across entities.
2. **Messages:** Each message belongs to a specific conversation.

![Comments data model](/comments-data-model.svg)

### Comment Body (Zettel)

The body of each comment is stored in a format called [Zettel](https://github.com/opral/monorepo/tree/main/packages/zettel/zettel-ast).

Zettel is a portable, JSON-based Abstract Syntax Tree (AST) for rich text. Think of it as a structured, machine-readable version of Markdown.

Using Zettel makes comments highly interoperable. It allows different applications and rich text editors to read, render, and edit comment content without losing formatting or data. It's designed to be extensible, so you can define your own custom elements like mentions or embedded objects, while still allowing other applications to gracefully handle unknown types.
