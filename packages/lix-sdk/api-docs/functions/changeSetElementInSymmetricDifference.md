[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeSetElementInSymmetricDifference

# Function: changeSetElementInSymmetricDifference()

> **changeSetElementInSymmetricDifference**(`a`, `b`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-set-element-in-symmetric-difference.ts:20](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/query-filter/change-set-element-in-symmetric-difference.ts#L20)

Returns the symmetric difference between two change sets.

The symmetric difference is the set of changes
that exist in either one version but not both.
Modeled after https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference

## Parameters

### a

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

### b

`Pick`\<[`ChangeSet`](../type-aliases/ChangeSet.md), `"id"`\>

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change_set_element")
    .where(changeSetElementInSymmetricDifference(a: changeSetA, b: changeSetB))
    .selectAll()
    .execute();
  ```
