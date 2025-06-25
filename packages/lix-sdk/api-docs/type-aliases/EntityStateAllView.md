[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / EntityStateAllView

# Type Alias: EntityStateAllView\<T\>

> **EntityStateAllView**\<`T`\> = `T` & `EntityStateAllColumns`

Defined in: [packages/lix-sdk/src/entity-views/types.ts:84](https://github.com/opral/monorepo/blob/3025726c2bce8185b41ef0b1b2f7cc069ebcf2b0/packages/lix-sdk/src/entity-views/types.ts#L84)

View type for entities across all versions.

This type combines your entity properties with Lix operational columns
including the version_id, allowing you to query and manipulate entities
in specific versions.

Use this type when defining database views that need to work across
multiple versions.

## Type Parameters

### T

`T`

## Example

```typescript
// Define a view type for key-value entities across versions
type KeyValueAllView = EntityStateAllView<KeyValue>;

// Query entities in a specific version
await lix.db
  .selectFrom("key_value_all")
  .where("lixcol_version_id", "=", "v2")
  .selectAll()
  .execute();
```
