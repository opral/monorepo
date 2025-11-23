# Data Model

Lix's data model is built on two core concepts: **entities** and **schemas**. Understanding these concepts is essential to working with Lix effectively.

## Entities: Meaningful Units of Data

An **entity** is a meaningful, addressable unit of data within a file. Instead of treating files as single blobs or tracking line-by-line changes, Lix uses plugins to identify and track individual entities.

### What Counts as an Entity?

The definition depends on the file type and the plugin that handles it:

| File Type                          | Example Entities                                                        |
| :--------------------------------- | :---------------------------------------------------------------------- |
| **JSON**                           | A specific key-value pair, an item in an array, or a nested object     |
| **Spreadsheets (Excel, CSV)**      | A complete row, or an individual cell at a specific coordinate          |
| **Documents (docx, md)**           | A paragraph, a heading, a list item, or a code block                    |
| **Design Files (Figma, Sketch)**   | A component, a frame, a layer, a text node, or a vector shape           |
| **3D Models (glTF, FBX)**          | A mesh, a material, a bone in a skeleton, or a node in the scene graph  |
| **Image Files (PSD, Krita)**       | A layer, a labeled object or region, or a path                          |

### Why Entity-Level Tracking Matters

Traditional version control systems like Git track files line-by-line. This works for code but fails for complex formats. Consider this JSON change:

```diff
- {"name":"John","age":30,"city":"New York"}
+ {"name":"John","age":31,"city":"New York"}
```

Git sees "line 1 changed," but the **meaning** of the change is lost. Applications can't programmatically answer:
- "What did the `age` property change from and to?"
- "Show me the history of all changes to `age`"
- "Who changed the age and when?"

Lix's entity-based model solves this by enabling:

**Fine-Grained Diffs**
- Instead of "line 5 changed," you get "the `age` property changed from 30 to 31"
- See [Diffs](/docs/diffs) for details

**Precise Commenting**
- Attach discussions to a specific paragraph, cell, or function
- Not just to the file as a whole

**Smart Merging**
- Changes to different entities merge automatically
- Even if they're on the same line in the text file

**Granular Access Control**
- Grant permissions per entity
- Users can edit specific fields but not others

### Example: JSON Entities

The Lix JSON plugin treats each property path as a unique entity:

```json
{
  "user": {
    "name": "John Doe"
  },
  "theme": "dark"
}
```

This creates two entities:
1. `user.name` with value `"John Doe"`
2. `theme` with value `"dark"`

If someone changes `theme` to `"light"`, the plugin detects this as a change to the `theme` entity. This change is queryable, mergeable, and trackable at a granular level.

## Schemas: Defining Entity Structure

A **Lix Schema** formally defines the structure of data for a type of entity. Think of it as a contract that ensures data consistency across the system.

### The Role of Schemas

Schemas are fundamental to how Lix works:

**Data Contract**
- Defines exactly what data a plugin will provide
- Example: The JSON plugin's schema guarantees every change includes a `property` (the path) and a `value`

**Validation**
- Lix validates changes against schemas
- Prevents corrupt or malformed data

**Interoperability**
- Schemas make entity data understandable across the system
- UIs, diffing tools, and other plugins can work with any entity type

### Schema Structure

Lix schemas extend [JSON Schema](https://json-schema.org/) with Lix-specific properties prefixed with `x-lix-`.

Here's a simple example from the JSON plugin:

```ts
import type { LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPropertySchema: LixSchemaDefinition = {
  "x-lix-key": "plugin_json_property",      // Unique identifier
  "x-lix-version": "1.0",                    // Schema version
  type: "object",
  properties: {
    property: { type: "string" },            // The JSON path
    value: { /* accepts any JSON value */ }, // The property value
  },
  required: ["property", "value"],
  additionalProperties: false,
};
```

**Lix-Specific Fields:**
- `x-lix-key`: Globally unique identifier (snake_case)
- `x-lix-version`: Version number for schema evolution

**Standard JSON Schema Fields:**
- `type`, `properties`, `required`, etc.

### Advanced Schema Features

Schemas can define relational constraints for structured data:

```ts
const AccountSchema: LixSchemaDefinition = {
  "x-lix-key": "example_account",
  "x-lix-version": "1.0",
  "x-lix-primary-key": ["/id"],              // Unique identifier
  "x-lix-unique": [["/email"]],              // Email must be unique
  "x-lix-foreign-keys": [                    // Reference other entities
    {
      properties: ["/owner_id"],
      references: {
        schemaKey: "user",                   // References 'user' schema
        properties: ["/id"],
      },
    },
  ],
  type: "object",
  properties: {
    id: { type: "string", "x-lix-default": "lix_uuid_v7()" },
    name: { type: "string" },
    email: { type: "string" },
    owner_id: { type: "string" },
    created_at: {
      type: "string",
      format: "date-time",
      "x-lix-default": "lix_now()",          // Auto-generated timestamp
    },
  },
  required: ["id", "name", "email", "owner_id", "created_at"],
};
```

**Additional Lix Fields:**
- `x-lix-primary-key`: Properties that uniquely identify an entity
- `x-lix-unique`: Properties that must be unique across all entities
- `x-lix-foreign-keys`: Relationships to other entity types
- `x-lix-default`: Auto-generated values (IDs, timestamps)

## How Entities, Schemas, and Plugins Work Together

These three concepts form a cohesive system:

```
Plugin              Schema              Entity
  ↓                   ↓                   ↓
Understands    Defines structure    Actual data
file format    of entity data       being tracked
```

**Example Flow:**

1. **Plugin** parses a JSON file and detects a change to `theme`
2. **Schema** defines that a JSON property change must have a `property` and `value`
3. **Entity** `theme` is updated with the new value `"light"`
4. Lix stores this change, validated against the schema

This separation makes Lix extensible - you can add support for any file format by:
1. Creating a plugin that understands the format
2. Defining a schema for the entity structure
3. Having the plugin report changes according to that schema

## Key Takeaways

- **Entities** are meaningful units of data within files (properties, cells, paragraphs)
- **Schemas** define the structure and constraints of entity data
- **Plugins** connect file formats to the Lix data model
- Together, they enable queryable, mergeable, fine-grained change tracking

## Next Steps

- Learn about [Architecture](/docs/architecture) to see how the system fits together
- Explore [Change Control features](/docs/versions) to see what you can build
- Read the [Metadata guide](/docs/metadata) for adding custom data to entities
