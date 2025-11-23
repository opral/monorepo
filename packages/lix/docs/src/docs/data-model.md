# Data Model

Lix tracks changes at the **entity level** using **schemas** to define entity structure. This works for any file type - text or binary.

## Entities: Meaningful Units of Data

An **entity** is a meaningful, addressable unit of data within a file. Plugins define what counts as an entity based on the file type.

### Examples of entities

| File Type                          | Example Entities                                                        |
| :--------------------------------- | :---------------------------------------------------------------------- |
| **JSON**                           | `/user/name`, `/theme`, `/items/0` (JSON Pointer paths)                |
| **Markdown**                       | A paragraph, heading, list, or code block                               |
| **Spreadsheets (Excel, CSV)**      | A row, or an individual cell                                            |
| **Design Files (Figma, Sketch)**   | A component, frame, layer, text node, or vector shape                   |
| **3D Models (glTF, FBX)**          | A mesh, material, bone in a skeleton, or node in the scene graph        |
| **Image Files (PSD, Krita)**       | A layer, labeled object or region, or path                              |

The key insight: Lix works with **any file format** - text or binary. Plugins teach Lix how to understand the structure, enabling entity-level tracking regardless of the underlying format.

### Why Entity-Level Tracking?

Entity-level tracking enables:

**Fine-Grained Diffs**
- See exactly what changed: "the `/user/age` property changed from 30 to 31"
- Not just "line 5 changed"

**Semantic Queries**
- "Show me the history of `/user/age`"
- "Who changed this specific paragraph?"
- "What cells in this spreadsheet were modified?"

**Smart Merging**
- Changes to different entities merge automatically
- Even if they're on the same line in the source file

**Precise Comments**
- Attach discussions to a specific paragraph, cell, or component
- Not just to the file as a whole

### Example: JSON Entities

The JSON plugin uses JSON Pointer (RFC 6901) to identify entities:

```json
{
  "user": {
    "name": "John Doe",
    "age": 30
  },
  "theme": "dark"
}
```

This creates entities with these IDs:
- `/user/name` with value `"John Doe"`
- `/user/age` with value `30`
- `/theme` with value `"dark"`

If someone changes `theme` to `"light"`, the plugin detects this as a change to the `/theme` entity. This change is queryable, mergeable, and trackable at a granular level.

## Schemas: Defining Entity Structure

A **schema** defines the structure and constraints of an entity type. Schemas use [JSON Schema](https://json-schema.org/) with Lix-specific extensions prefixed with `x-lix-`.

### Schema Example

Here's the actual schema from the JSON plugin:

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
      // Accepts any JSON value
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

### Schema Features

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

**Additional Fields:**
- `x-lix-unique`: Properties that must be unique across entities
- `x-lix-foreign-keys`: Define relationships between entity types
- `x-lix-default`: Auto-generated values (UUIDs, timestamps, etc.)

### Why Schemas Matter

**Validation**
- Lix validates all changes against schemas
- Prevents corrupt or malformed data from entering the database

**Interoperability**
- Schemas make entity data understandable across the system
- UIs, diffing tools, and queries can work with any entity type

**Evolution**
- Schema versioning (`x-lix-version`) enables safe data model changes
- Migrate entities from old schemas to new ones

## How Entities, Schemas, and Plugins Work Together

```
Plugin              Schema              Entity
  ↓                   ↓                   ↓
Understands    Defines structure    Actual data
file format    of entity data       being tracked
```

**Example Flow:**

1. User updates `theme` from `"dark"` to `"light"` in a JSON file
2. **Plugin** parses the file and detects the change at `/theme`
3. **Schema** validates the change has required `path` and `value` fields
4. **Entity** `/theme` is updated in the database with the new value
5. Change is now queryable, mergeable, and part of the file's history

This separation makes Lix extensible - add support for any file format (text or binary) by:
1. Creating a plugin that understands the format
2. Defining schemas for the entity types
3. Having the plugin detect and report changes according to those schemas

## Key Takeaways

- **Entities** are meaningful units of data within files - properties, paragraphs, layers, meshes, etc.
- **Schemas** define structure and constraints using JSON Schema with Lix extensions
- **Plugins** connect file formats (text or binary) to the entity model
- Together, they enable queryable, mergeable, fine-grained change tracking for any data type

## Next Steps

- See [Plugins](/docs/plugins) to learn how plugins detect entities
- Explore [Querying Changes](/docs/querying-changes) to work with entity data
- Read [Architecture](/docs/architecture) to understand how the system fits together
