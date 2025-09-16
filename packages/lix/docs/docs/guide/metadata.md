# Metadata

Metadata allows attaching context to state records you don't own. Primary use case: adding application-specific information to external schemas.

## Example: Conversation API

> [!NOTE]
> Entity views (for example `conversation_message`) surface change metadata through the
> operational column `lixcol_metadata`. When you interact with the lower-level state tables
> (`state`, `state_all`) the same metadata is available on the `metadata` column.

```typescript
// Conversation message schema is owned by Lix.
// Your app attaches metadata for LLM context to the change itself.

const assistantMessage = {
  entity_id: "msg-123",
  schema_key: "lix_conversation_message",
  snapshot_content: {
    content: "Hello, how can I help you?",
    conversation_id: "conv-456"
  },
  metadata: {
    llm_role: "assistant",
    llm_model: "gpt-4",
    llm_temperature: 0.7
  }
};

// Reading the same metadata from the entity view.
const message = await lix.db
  .selectFrom("conversation_message")
  .where("id", "=", assistantMessage.entity_id)
  .select(["body", "lixcol_metadata"])
  .executeTakeFirst();

console.log(message?.lixcol_metadata?.llm_role); // "assistant"
```

## Usage

```typescript
// Adding metadata to state
await lix.db.insertInto("state_all").values({
  entity_id: "msg-456",
  schema_key: "lix_conversation_message",
  snapshot_content: { content: "User input", conversation_id: "conv-123" },
  metadata: { myapp_role: "user", myapp_session: "sess-789" },
  // ... other required fields
});

// File metadata flows to state records
const file = {
  path: "/data.json",
  data: content,
  metadata: { imported_from: "slack" }  // Inherited by all state from this file
};

// Updating metadata - use JSON functions to update specific properties
await lix.db
  .updateTable("state_all")
  .set({
    metadata: sql`json_set(metadata, '$.llm_model', 'gpt-4-turbo')`
  })
  .where("entity_id", "=", "msg-123")
  .execute();
// This preserves other metadata properties, only updates llm_model
```

## Querying

```typescript
// Find messages by role
const userMessages = await lix.db
  .selectFrom("state_all")
  .where(sql`json_extract(metadata, '$.llm_role')`, "=", "user")
  .selectAll()
  .execute();

// Query external data with your metadata
const externalData = await lix.db
  .selectFrom("state_all")
  .where(sql`json_extract(metadata, '$.myapp_imported_from')`, "=", "slack")
  .selectAll()
  .execute();

// Using an entity view? Reference lixcol_metadata instead.
const slackMessages = await lix.db
  .selectFrom("conversation_message")
  .where(sql`json_extract(lixcol_metadata, '$.myapp_imported_from')`, "=", "slack")
  .selectAll()
  .execute();
```

## Dos and Don'ts

### Dos

```typescript
// ✅ Namespace your keys to avoid collisions
metadata: { myapp_role: "assistant", myapp_session: "123" }

// ✅ Add context to external schemas
metadata: { myapp_priority: "high" }  // On a lix_conversation_message

// ✅ Handle missing metadata with defaults
const role = state.metadata?.myapp_role ?? "user";

// ✅ Keep metadata small and focused
metadata: { myapp_status: "reviewed", myapp_score: 5 }
```

### Don'ts

```typescript
// ❌ Don't use metadata for data you own - use key-value instead
metadata: { theme: "dark" }  // Wrong: use key_value table
await lix.db.insertInto("key_value")
  .values({ key: "theme", value: "dark" })  // Correct

// ❌ Don't duplicate snapshot_content
snapshot_content: { text: "Hello" },
metadata: { text: "Hello" }  // Wrong: already in snapshot

// ❌ Don't use generic keys without namespacing
metadata: { role: "user" }  // Wrong: could collide
metadata: { myapp_role: "user" }  // Correct

// ❌ Don't store large objects
metadata: {
  history: [/* 1000 items */]  // Wrong: too large
}
```
