# Conversations

Lix has a universal commenting system. You can attach conversations to any entity — paragraphs, JSON properties, CSV cells, files, change sets, versions, and more. This “attach to any entity” model is a core super power of Lix.

![Conversations](/comments.svg)

## Use cases

- Change discussions: Propose, review, and sign off bundles of changes (PR-like) with entity-level context.
- Inline commenting: Threaded discussions on specific entities (paragraphs, spreadsheet cells, JSON properties) across versions.
- AI co-pilot chat: Agent/user threads anchored to an entity or version; store roles and tool metadata per message.

## Examples

```ts
import { openLix, createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";

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

## Data Model

Conversations are composed of two main parts:

1. **Conversations:** A conversation is a discussion that can be attached to one or more entities. This makes it possible to have shared conversations across entities.
2. **Messages:** Each message belongs to a specific conversation.

![Conversations data model](/comments-data-model.svg)

### Message Body (Zettel)

The body of each message is stored in a format called [Zettel](https://github.com/opral/monorepo/tree/main/packages/zettel/zettel-ast).

Zettel is a portable, JSON-based Abstract Syntax Tree (AST) for rich text. Think of it as a structured, machine-readable version of Markdown.

Using Zettel makes messages highly interoperable. It allows different applications and rich text editors to read, render, and edit content without losing formatting or data. It's designed to be extensible, so you can define your own custom elements like mentions or embedded objects, while still allowing other applications to gracefully handle unknown types.

## API Reference quick-links

| Function / Type        | Purpose                                 | Docs                                           |
| ---------------------- | --------------------------------------- | ---------------------------------------------- |
| `attachConversation()` | Attach an existing conversation to an entity | /api/functions/attachConversation |
| `detachConversation()` | Detach a conversation from an entity    | /api/functions/detachConversation |
