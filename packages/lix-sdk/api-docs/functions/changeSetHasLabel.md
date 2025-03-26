[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeSetHasLabel

# Function: changeSetHasLabel()

> **changeSetHasLabel**(`name`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-set-has-label.ts:25](https://github.com/opral/monorepo/blob/b171e3e71d4461028abf991c33609fbcfb064d33/packages/lix-sdk/src/query-filter/change-set-has-label.ts#L25)

Selects change sets that have a label with the given name.

## Parameters

### name

`string`

## Returns

`Function`

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`, `SqlBool`\>

## Examples

```ts
  await lix.db.selectFrom("change_set")
     .where(changeSetHasLabel("checkpoint"))
     .selectAll()
     .execute();
  ```

You can use eb.not() to negate the filter.

  ```ts
  await lix.db.selectFrom("change_set")
		.where((eb) => eb.not(changeSetHasLabel("checkpoint")))
		.selectAll()
		.execute();
  ```
