# Metadata

Metadata allows you to attach additional data to entities without modifying their [schema](/docs/schemas).

## When to Use Metadata

Use metadata when you need to add data to entities whose schema you don't control.

Examples:

- **Lix schemas:** Add `LLM_role` to [conversations](/docs/conversations), `jira_ticket_id` to commits, or `imported_from` to [files](/docs/filesystem)
- **Plugin schemas:** Add `last_verified` timestamp to a JSON property from the [JSON plugin](/plugins/plugin_json)

## Using Metadata

Metadata is a JSON object attached to entities.

### Attach Metadata

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

### Update Metadata

Use SQL JSON functions to update specific properties without overwriting the entire object:

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

### Query Metadata

Use SQL JSON functions to filter by metadata:

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

**Note:** Metadata is in the `metadata` column for state tables, and `lixcol_metadata` for entity views.

## Best Practices

**Use metadata for schemas you don't own.** If you control the schema, add properties directly to it instead.

**Namespace your keys.** Prefix keys with your app name (e.g., `myapp_role`) to avoid collisions.

**Handle missing values.** Always provide defaults: `const role = state.metadata?.myapp_role ?? "user"`

**Keep it small.** Avoid large objects or binary data.
