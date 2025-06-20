[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixSchemaDefinition

# Type Alias: LixSchemaDefinition

> **LixSchemaDefinition** = `JSONSchema` & `object`

Defined in: [packages/lix-sdk/src/schema-definition/definition.ts:3](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/schema-definition/definition.ts#L3)

LixSchema

A superset of JSON Schema (draft-07) that includes Lix-specific metadata
and supports custom extensions.

Custom extensions may be added with any x-* prefix.

## Type declaration

### type

> **type**: `"object"`

### x-lix-foreign-keys?

> `optional` **x-lix-foreign-keys**: `object`

Foreign key constraints referencing other schemas.

#### Index Signature

\[`localProperty`: `string`\]: `object`

#### Example

```ts
{
	 *     "x-lix-foreign-keys": {
	 *       "author_id": {
	 *         "schemaKey": "user_profile",
	 *         "property": "id"
	 *       },
	 *       "category_id": {
	 *         "schemaKey": "post_category",
	 *         "property": "id"
	 *       }
	 *     }
	 *   }
```

### x-lix-key

> **x-lix-key**: `string`

The key of the schema.

The key is used to identify the schema. You must use a
unique key for each schema.

#### Example

```ts
"csv_plugin_cell"
```

### x-lix-primary-key?

> `optional` **x-lix-primary-key**: `string`[] \| readonly `string`[]

### x-lix-unique?

> `optional` **x-lix-unique**: `string`[][] \| readonly readonly `string`[][]

Properties that must be unique per version.

Not to be confused by `x-version` which is used for versioning the schema.

#### Example

```ts
{
	 *     "x-lix-unique": [
	 *       // the id must be unique
	 *       ["id"],
	 *       // the name and age must be unique as well
	 *       ["name", "age"],
	 *     ],
	 *     properties: {
	 *       id: { type: "string" },
	 *       name: { type: "string" },
	 *       age: { type: "number" },
	 *     },
	 *   }
```

### x-lix-version

> **x-lix-version**: `string`

The version of the schema.

Use the major version to signal breaking changes.
Use the minor version to signal non-breaking changes.

#### Example

```ts
"1.0"
```
