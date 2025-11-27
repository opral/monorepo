# Schemas

Schemas define the structure of data that Lix tracks. They enable schema-aware change tracking by telling Lix what constitutes a meaningful unit of change (an entity) and how to validate it.

## What is a Schema?

A schema defines the structure and constraints of an entity type using [JSON Schema](https://json-schema.org/) with Lix-specific extensions (prefixed with `x-lix-`).

Example from the [JSON plugin](/plugins/plugin_json):

```ts
import type { LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPointerValueSchema: LixSchemaDefinition = {
  "x-lix-key": "plugin_json_pointer_value",   // Unique identifier
  "x-lix-version": "1.0",                      // Schema version
  "x-lix-primary-key": ["/path"],              // Primary key
  type: "object",
  properties: {
    path: {
      type: "string",
      description: "RFC 6901 JSON Pointer (e.g., '/user/name')",
    },
    value: {
      description: "JSON value at the pointer path",
    },
  },
  required: ["path", "value"],
  additionalProperties: false,
};
```

**Lix-Specific Fields:**
- `x-lix-key`: Globally unique schema identifier (snake_case)
- `x-lix-version`: Version number for schema evolution
- `x-lix-primary-key`: JSON Pointer(s) to properties that uniquely identify an entity

**Standard JSON Schema Fields:**
- `type`, `properties`, `required`, `additionalProperties`, etc.

## Additional Schema Features

Schemas can include additional constraints and features:

```ts
const MySchema: LixSchemaDefinition = {
  "x-lix-key": "my_entity",
  "x-lix-version": "1.0",
  "x-lix-primary-key": ["/id"],
  "x-lix-unique": [["/email"]],              // Unique constraints
  "x-lix-foreign-keys": [                    // Relationships
    {
      properties: ["/user_id"],
      references: {
        schemaKey: "user",
        properties: ["/id"],
      },
    },
  ],
  type: "object",
  properties: {
    id: {
      type: "string",
      "x-lix-default": "lix_uuid_v7()",      // Auto-generated ID
    },
    email: { type: "string" },
    user_id: { type: "string" },
    created_at: {
      type: "string",
      format: "date-time",
      "x-lix-default": "lix_now()",          // Auto-generated timestamp
    },
  },
  required: ["id", "email"],
};
```

**Available Fields:**
- `x-lix-unique`: Properties that must be unique across entities
- `x-lix-foreign-keys`: Define relationships between entity types
- `x-lix-default`: Auto-generated values using `lix_uuid_v7()`, `lix_now()`, etc.

Schemas provide validation (prevents corrupt data), interoperability (any tool can understand entity structure), and evolution (version and migrate data safely).

## Entities

An **entity** is a meaningful unit of data tracked by Lix. Schemas define entity structure. Plugins detect entities in files.

### Entity Examples by File Type

| File Type                          | Example Entities                                                        |
| :--------------------------------- | :---------------------------------------------------------------------- |
| **JSON**                           | `/user/name`, `/theme`, `/items/0` (JSON Pointer paths)                |
| **CSV/Excel**                      | A row, or an individual cell                                            |
| **Markdown**                       | A paragraph, heading, list, or code block                               |
| **Design Files**                   | A component, frame, layer, text node, vector shape                      |
| **3D Models**                      | A mesh, material, bone, or scene graph node                             |

### Example: JSON Entities

For this JSON file:

```json
{
  "user": {
    "name": "John Doe",
    "age": 30
  },
  "theme": "dark"
}
```

The JSON plugin creates entities:
- `/user/name` = `"John Doe"`
- `/user/age` = `30`
- `/theme` = `"dark"`

When `theme` changes to `"light"`, the plugin detects a change to the `/theme` entity. This change is validated against the schema, stored, and queryable.

## How It Works

**Plugin → Schema → Entity flow:**

1. User updates a file (e.g., changes `theme` to `"light"`)
2. **Plugin** parses the file and detects changes
3. **Schema** validates the change structure
4. **Entity** is updated in the database
5. Change is queryable, mergeable, and part of history

This enables Lix to support any file format by defining schemas and plugins that understand the format's structure.

## Next Steps

- See [Plugins](/docs/plugins) to learn how plugins detect entities
- Explore [SQL Interface](/docs/sql-interface) to work with entity data
- Read [Architecture](/docs/architecture) to understand how the system fits together
