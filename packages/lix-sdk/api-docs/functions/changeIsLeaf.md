[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / changeIsLeaf

# Function: changeIsLeaf()

> **changeIsLeaf**(): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf.ts:18](https://github.com/opral/monorepo/blob/f4435d280cb682cf73d4f843d615781e28b8d0ec/packages/lix-sdk/src/query-filter/change-is-leaf.ts#L18)

Selects changes that are not a parent of any other change.

**Careful**: This filter is not specific to any version.
If you want to filter changes in a specific version, use `changeIsLeafInversion`.

## Returns

`Function`

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
