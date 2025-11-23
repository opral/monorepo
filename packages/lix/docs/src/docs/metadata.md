# What is Metadata?

In Lix, **metadata** refers to arbitrary, structured data that you can attach to entities or changes. It provides a flexible way to add context, annotations, flags, or any application-specific information to your Lix state, especially for data records whose primary schema you do not control.

## When to Use Metadata

The answer is simple: Use metadata when an [entity](./entity) is not owned by your application, but for interoperability reasons, you need to use that entity or its schema. In such cases, you can attach metadata to add your application's specific information without altering the original entity's schema.

Here are some examples:

- **Lix Conversation API:** Lix provides a schema for conversation messages (`lix_conversation_message`). Your application might want to store additional context for these messages, such as the `LLM_role` (e.g., "user", "assistant") or the `LLM_model` used to generate a response. Since you don't own the `lix_conversation_message` schema, you use metadata to attach this information.
- **Third-Party Plugin Data:** If you're using a plugin that processes a specific file format (e.g., a Markdown plugin), you might want to add your own application-specific flags or annotations to the entities (e.g., a `review_status` on a Markdown heading) without modifying the plugin's schema.
- **Standard Lix Entities:** For core Lix entities like `file` or `commit`, you can attach metadata to store application-specific details (e.g., `imported_from_source` for a file, or `jira_ticket_id` for a commit).

## How to Use Metadata

Metadata is stored as a JSON object. You can attach it when creating or updating entities.

### Attaching Metadata

When inserting or updating records in Lix, you can include a `metadata` property, which should be a JSON object.

```typescript
// Attaching metadata when inserting a new state record
await lix.db
  .insertInto("state")
  .values({
    entity_id: "task-123", // The unique ID of this entity
    schema_key: "my_app_entity", // The schema defining this entity
    snapshot_content: {
      // The actual data of the entity
      id: "task-123",
      name: "Review PR",
    },
    metadata: {
      // The metadata for this state record
      priority: "high",
      assigned_to: "dev_team",
      source: "jira_ticket_456",
    },
  })
  .execute();
```

### Updating Metadata

To update specific properties within an existing metadata object, use SQL JSON functions like `json_set`. This allows you to modify metadata without overwriting the entire object.

```typescript
// Update a specific metadata property for an entity
await lix.db
  .updateTable("my_app_entity")
  .set({
    metadata: sql`json_set(metadata, '$.priority', 'urgent')`,
  })
  .where("id", "=", "task-123")
  .execute();
// This preserves other metadata properties like 'assigned_to'
```

## Querying Metadata

You can query entities based on their metadata using SQL JSON functions like `json_extract`.

```typescript
// Find entities with high priority
const highPriorityTasks = await lix.db
  .selectFrom("my_app_entity")
  .where(sql`json_extract(metadata, '$.priority')`, "=", "high")
  .selectAll()
  .execute();

// Find conversation messages from a specific LLM model
const gpt4Messages = await lix.db
  .selectFrom("conversation_message")
  .where(sql`json_extract(lixcol_metadata, '$.llm_model')`, "=", "gpt-4")
  .selectAll()
  .execute();
```

**Important Note on Columns:**
When querying raw state tables (e.g., `state`), metadata is available in the `metadata` column. However, when querying entity views (e.g., `conversation_message`), metadata is surfaced through the operational column `lixcol_metadata`. Always use the correct column name for the view you are querying.

## Best Practices

Follow these guidelines for effective metadata usage:

### Do's

- **Namespace your keys:** Prefix your metadata keys with your application's name or a unique identifier (e.g., `myapp_role`, `inlang_priority`) to prevent collisions with other plugins or Lix's internal metadata.
- **Add context to external schemas:** Use metadata to enrich entities whose primary schema you don't control (e.g., adding `myapp_priority: "high"` to a `lix_conversation_message`).
- **Handle missing metadata with defaults:** Always assume metadata properties might be missing and provide fallbacks (e.g., `const role = state.metadata?.myapp_role ?? "user";`).
- **Keep metadata small and focused:** Metadata is best for small, structured data. Avoid storing large objects or binary data.

### Don'ts

- **Don't use metadata for data you own:** If you control the schema of an entity, add the property directly to the schema instead of using metadata. Metadata is for _additional_ context, not core data.
- **Don't duplicate `snapshot_content`:** Avoid storing data in metadata that is already present in the entity's `snapshot_content`.
- **Don't store large objects:** Avoid storing large arrays, long strings, or binary data in metadata, as this can impact performance and repository size.
