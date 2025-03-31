[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLowestCommonAncestorOf

# Function: changeIsLowestCommonAncestorOf()

> **changeIsLowestCommonAncestorOf**(`changes`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-lowest-common-ancestor-of.ts:16](https://github.com/opral/monorepo/blob/e56b872498d48e57574f781e8cd2e240c1f6f0b2/packages/lix-sdk/src/query-filter/change-is-lowest-common-ancestor-of.ts#L16)

Filters changes that are the lowest common ancestor of the given changes.

## Parameters

### changes

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>[]

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  const lowestCommonAncestor = await lix.db.selectFrom("change")
     .where(changeIsLowestCommonAncestorOf([change1, change2, change3]))
     .selectAll()
     .executeTakeFirst();
  ```
