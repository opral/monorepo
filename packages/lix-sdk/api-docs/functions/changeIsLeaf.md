[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLeaf

# Function: changeIsLeaf()

> **changeIsLeaf**(): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf.ts:18](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-is-leaf.ts#L18)

Selects changes that are not a parent of any other change.

**Careful**: This filter is not specific to any version.
If you want to filter changes in a specific version, use `changeIsLeafInversion`.

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeaf())
    .selectAll()
    .execute();
  ```
