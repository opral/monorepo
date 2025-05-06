[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeHasLabel

# Function: changeHasLabel()

> **changeHasLabel**(`label`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-has-label.ts:25](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/query-filter/change-has-label.ts#L25)

Selects changes that have a label with the given name.

## Parameters

### label

\{ `id`: `string`; `name?`: `string`; \} | \{ `id?`: `string`; `name`: `string`; \}

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Examples

```ts
  await lix.db.selectFrom("change")
     .where(changeHasLabel({ name: "checkpoint" }))
     .selectAll()
     .execute();
  ```

You can use eb.not() to negate the filter.

  ```ts
  await lix.db.selectFrom("change")
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint"})))
		.selectAll()
		.execute();
  ```
