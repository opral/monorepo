# What is a Lix Schema?

A **Lix Schema** is a formal definition that describes the structure of data for a type of [entity](./entity.md). It acts as a contract that ensures data is consistent and understandable throughout the Lix ecosystem.

Lix schemas are based on the widely-used [JSON Schema](https://json-schema.org/) standard, with a few Lix-specific extensions.

## The Role of a Schema

Schemas are fundamental to how Lix understands and manages data. They are not just for validation; they are the core of what makes entity-level operations possible.

- **Data Contract:** A schema defines exactly what data a plugin will provide when it reports a change. For example, the JSON plugin's schema guarantees that a change will always include a `property` (the path) and a `value`.
- **Validation:** Lix can validate incoming changes against a schema to ensure data integrity and prevent corrupt or malformed data from entering the system.
- **Interoperability:** By adhering to a schema, a plugin makes its data understandable to other parts of Lix, including the UI, diffing tools, and other plugins, without them needing to know the specifics of the original file format.

## Anatomy of a Lix Schema

Lix Schemas extend standard JSON Schema with several `x-lix-` properties that provide Lix-specific metadata.

Let's start with a simple example, the `JSONPropertySchema` from the Lix JSON Plugin:

```ts
import type { LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPropertySchema: LixSchemaDefinition = {
  "x-lix-key": "plugin_json_property",
  "x-lix-version": "1.0",
  type: "object",
  properties: {
    property: { type: "string" },
    value: {
      /* a schema that accepts any JSON value */
    },
  },
  required: ["property", "value"],
  additionalProperties: false,
};
```

This schema has two types of fields:

**1. Lix-Specific Fields (Basic):**

- **`x-lix-key`**: A globally unique string that identifies this schema. Keys must be snake_case (start with a lowercase letter, contain only lowercase letters, numbers, and underscores) so they can be safely embedded in SQL identifiers. When a plugin reports a change, it references this key, telling Lix which schema to use for validation and interpretation.
- **`x-lix-version`**: A version number for the schema itself, allowing schemas to evolve over time.

**2. Standard JSON Schema Fields:**

- **`type`**, **`properties`**, **`required`**, etc.: These are standard JSON Schema keywords that define the shape of the data.

## Advanced Schema Features: Relational Data and Constraints

Lix Schemas offer additional `x-lix-` properties to define more complex relationships and constraints, enabling features like primary keys, unique constraints, foreign keys, and auto-generated fields.

Let's look at a more advanced `AccountSchema` example:

```ts
const AccountSchema: LixSchemaDefinition = {
  "x-lix-key": "example_account",
  "x-lix-version": "1.0",
  "x-lix-primary-key": ["/id"],
  "x-lix-unique": [
    ["/email"], // email must be unique
  ],
  "x-lix-foreign-keys": [
    {
      properties: ["/owner_id"],
      references: {
        schemaKey: "user", // References a 'user' schema
        properties: ["/id"],
      },
    },
  ],
  type: "object",
  properties: {
    id: { type: "string", "x-lix-default": "lix_uuid_v7()" }, // Auto-generated ID
    name: { type: "string" },
    email: { type: "string" },
    owner_id: { type: "string" },
    created_at: {
      type: "string",
      format: "date-time",
      "x-lix-default": "lix_now()",
    },
  },
  required: ["id", "name", "email", "owner_id", "created_at"],
  additionalProperties: false,
};
```

Here are the additional Lix-specific fields used in this advanced schema:

- **`x-lix-primary-key`**: An array of property names that form the primary key for entities conforming to this schema. These properties uniquely identify an entity.
- **`x-lix-unique`**: An array of arrays, where each inner array specifies a set of properties that must be unique across all entities of this schema.
- **`x-lix-foreign-keys`**: An array of objects defining foreign key constraints. Each object specifies:
  - `properties`: The local properties that form the foreign key.
  - `references`: An object detailing the referenced schema (`schemaKey`) and its properties.
  - `mode`: (Optional) Validation mode (`"immediate"` or `"materialized"`).
- **`x-lix-default`**: (Used within a property definition) A CEL expression evaluated when the property is omitted, typically used to generate IDs or timestamps on insert.

**2. Standard JSON Schema Fields:**

- **`type`**, **`properties`**, **`required`**, etc.: These are standard JSON Schema keywords that define the shape of the data.
