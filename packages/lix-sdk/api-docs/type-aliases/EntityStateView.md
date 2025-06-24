[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / EntityStateView

# Type Alias: EntityStateView\<T\>

> **EntityStateView**\<`T`\> = `T` & `EntityStateColumns`

Defined in: [packages/lix-sdk/src/entity-views/types.ts:59](https://github.com/opral/monorepo/blob/affb4c9a3f726a3aa66c498084ff5c7f09d2d503/packages/lix-sdk/src/entity-views/types.ts#L59)

View type for entities in the active version only.

This type combines your entity properties with Lix operational columns
(file_id, timestamps, etc.) while preserving LixGenerated markers for
database schema compatibility.

Use this type when defining database views that work with the current
active version only.

## Type Parameters

### T

`T`

## Example

```typescript
// Define a view type for key-value entities
type KeyValueView = EntityStateView<KeyValue>;

// The resulting type includes both entity properties and operational columns
// { key: string, value: any, lixcol_file_id: LixGenerated<string>, ... }
```
